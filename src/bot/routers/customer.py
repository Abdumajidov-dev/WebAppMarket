from __future__ import annotations
import logging

from aiogram import Router, F, Bot
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery
from redis.asyncio import Redis

from config import settings
from keyboards.reply import (
    main_menu_kb, shop_inline_kb, lang_kb,
    chat_type_kb, orders_for_chat_kb,
)
from services.api_client import api_client
from services.user_settings import UserSettings
from utils.i18n import t, fmt_order_line, ACTIVE_STATUSES, DONE_STATUSES

router = Router()
logger = logging.getLogger(__name__)

SUPPORT_USERNAME = "Software_developman"


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _lang(message: Message | CallbackQuery, redis: Redis) -> str:
    uid = message.from_user.id if message.from_user else 0
    return await UserSettings(redis).get_lang(uid)


# ── /start ────────────────────────────────────────────────────────────────────

@router.message(Command("start"))
async def cmd_start(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    await message.answer(
        t("welcome", lang),
        parse_mode="HTML",
        reply_markup=main_menu_kb(lang, settings.WEBAPP_URL),
    )


# ── Do'kon ────────────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_menu", "uz"), t("btn_menu", "ru")}))
async def open_shop(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    kb = shop_inline_kb(lang, settings.WEBAPP_URL)
    if kb:
        await message.answer(t("btn_menu", lang), reply_markup=kb)
    else:
        await message.answer(
            f"🛍 Do'kon manzili:\n{settings.WEBAPP_URL}\n\n"
            f"<i>Brauzerda oching</i>",
            parse_mode="HTML",
        )


# ── Til o'zgartirish ─────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_lang", "uz"), t("btn_lang", "ru")}))
async def choose_language(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    await message.answer(t("choose_lang", lang), reply_markup=lang_kb())


@router.callback_query(F.data.startswith("setlang:"))
async def set_language(callback: CallbackQuery, redis: Redis) -> None:
    new_lang = callback.data.split(":")[1]
    uid = callback.from_user.id
    settings_svc = UserSettings(redis)
    await settings_svc.set_lang(uid, new_lang)

    await callback.message.edit_text(t("lang_changed", new_lang))
    await callback.message.answer(
        t("welcome", new_lang),
        parse_mode="HTML",
        reply_markup=main_menu_kb(new_lang, settings.WEBAPP_URL),
    )
    await callback.answer()


# ── Aktiv buyurtmalar ────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_active_orders", "uz"), t("btn_active_orders", "ru")}))
async def active_orders(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    chat_id = message.from_user.id
    try:
        orders = await api_client.get_customer_orders(chat_id, active_only=True)
        active = [o for o in orders if o.get("status") in ACTIVE_STATUSES]
        if not active:
            await message.answer(t("no_active_orders", lang))
            return

        lines = [t("active_orders_title", lang)]
        for o in active[:10]:
            lines.append(f"• {fmt_order_line(o, lang)}")

        await message.answer("\n".join(lines), parse_mode="HTML")
    except Exception:
        logger.exception("active_orders uid=%s", chat_id)
        await message.answer(t("orders_error", lang))


# ── Tarix ────────────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_history", "uz"), t("btn_history", "ru")}))
async def order_history(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    chat_id = message.from_user.id
    try:
        orders = await api_client.get_customer_orders(chat_id)
        done = [o for o in orders if o.get("status") in DONE_STATUSES]
        if not done:
            await message.answer(t("no_history", lang))
            return

        lines = [t("history_title", lang)]
        for o in done[:15]:
            lines.append(f"• {fmt_order_line(o, lang)}")

        await message.answer("\n".join(lines), parse_mode="HTML")
    except Exception:
        logger.exception("order_history uid=%s", chat_id)
        await message.answer(t("orders_error", lang))


# ── Yordam / Chat ─────────────────────────────────────────────────────────────

class ChatState(StatesGroup):
    choosing_type = State()
    choosing_order = State()


@router.message(F.text.in_({t("btn_chat", "uz"), t("btn_chat", "ru")}))
async def support_menu(message: Message, state: FSMContext, redis: Redis) -> None:
    lang = await _lang(message, redis)
    await state.set_state(ChatState.choosing_type)
    await state.update_data(lang=lang)
    await message.answer(t("choose_chat_type", lang), reply_markup=chat_type_kb(lang))


@router.callback_query(ChatState.choosing_type, F.data == "chat:support")
async def chat_support(callback: CallbackQuery, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    await state.clear()
    await callback.message.edit_text(
        t("chat_support_link", lang),
        parse_mode="HTML",
    )
    await callback.answer()


@router.callback_query(ChatState.choosing_type, F.data == "chat:order")
async def chat_order_choose(callback: CallbackQuery, state: FSMContext, redis: Redis) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    chat_id = callback.from_user.id

    try:
        orders = await api_client.get_customer_orders(chat_id, active_only=True)
        active = [o for o in orders if o.get("status") in ACTIVE_STATUSES]
    except Exception:
        logger.exception("chat_order_choose uid=%s", chat_id)
        active = []

    if not active:
        await state.clear()
        await callback.message.edit_text(t("no_orders_for_chat", lang))
        await callback.answer()
        return

    await state.set_state(ChatState.choosing_order)
    await callback.message.edit_text(
        t("choose_order_for_chat", lang),
        reply_markup=orders_for_chat_kb(active, lang),
    )
    await callback.answer()


@router.callback_query(ChatState.choosing_order, F.data.startswith("chat:sel:"))
async def chat_order_selected(callback: CallbackQuery, state: FSMContext, bot: Bot) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    order_id = callback.data.split(":", 2)[2]
    await state.clear()

    # Seller ga xabar yuborish
    try:
        order = await api_client.get_order(order_id)
        seller_chat_id = order.get("tenantTelegramChatId")
        customer_username = callback.from_user.username
        customer_id = callback.from_user.id
        customer_name = callback.from_user.full_name

        if seller_chat_id:
            order_num = order.get("orderNumber", order_id[:8])
            seller_msg = (
                f"💬 <b>Mijozdan savol</b>\n\n"
                f"Buyurtma: <b>#{order_num}</b>\n"
                f"Mijoz: <b>{customer_name}</b>\n"
            )
            if customer_username:
                seller_msg += f"Telegram: @{customer_username}"
            else:
                seller_msg += f"Telegram ID: <code>{customer_id}</code>"

            await bot.send_message(seller_chat_id, seller_msg, parse_mode="HTML")

    except Exception:
        logger.exception("chat_order_selected order=%s", order_id)

    await callback.message.edit_text(t("seller_contact_sent", lang))
    await callback.answer()


@router.callback_query(F.data == "chat:cancel")
async def chat_cancel(callback: CallbackQuery, state: FSMContext, redis: Redis) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    await state.clear()
    await callback.message.edit_text(t("cancelled", lang))
    await callback.answer()
