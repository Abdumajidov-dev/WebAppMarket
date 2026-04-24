from __future__ import annotations
import logging

from aiogram import Router, F, Bot
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    Message, CallbackQuery,
    KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove,
    InlineKeyboardMarkup, InlineKeyboardButton,
)
from redis.asyncio import Redis

from config import settings
from keyboards.reply import (
    main_menu_kb, lang_kb,
    chat_type_kb, orders_for_chat_kb,
)
from services.api_client import api_client
from services.user_settings import UserSettings
from utils.i18n import t, fmt_order_line, ACTIVE_STATUSES, DONE_STATUSES

# imported lazily to avoid circular import
def _admin_router_funcs():
    from routers.admin import is_admin, register_admin_chat, admin_menu_kb
    return is_admin, register_admin_chat, admin_menu_kb

router = Router()
logger = logging.getLogger(__name__)

SUPPORT_USERNAME = "Software_developman"


class AppState(StatesGroup):
    waiting_phone = State()
    choosing_chat_type = State()
    choosing_order = State()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _lang(obj: Message | CallbackQuery, redis: Redis) -> str:
    uid = obj.from_user.id if obj.from_user else 0
    return await UserSettings(redis).get_lang(uid)


async def _get_phone(uid: int, redis: Redis) -> str | None:
    return await UserSettings(redis).get_phone(uid)


def _phone_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamni ulashish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


# ── /start ────────────────────────────────────────────────────────────────────

@router.message(Command("start"))
async def cmd_start(message: Message, redis: Redis) -> None:
    is_admin_fn, register_admin_fn, admin_menu_kb_fn = _admin_router_funcs()
    chat_id = message.chat.id

    # Auto-register from DB if not yet in Redis
    if not await is_admin_fn(chat_id, redis):
        slug = await api_client.get_tenant_slug_by_chat_id(chat_id)
        if slug:
            await register_admin_fn(chat_id, slug, redis)

    if await is_admin_fn(chat_id, redis):
        await message.answer(
            "🏪 <b>Admin paneli</b>\n\nXush kelibsiz!",
            parse_mode="HTML",
            reply_markup=admin_menu_kb_fn(),
        )
        return

    lang = await _lang(message, redis)
    await message.answer(
        t("welcome", lang),
        parse_mode="HTML",
        reply_markup=main_menu_kb(lang, settings.WEBAPP_URL),
    )


# ── Phone contact handler ─────────────────────────────────────────────────────

@router.message(AppState.waiting_phone, F.contact)
async def got_contact(message: Message, state: FSMContext, redis: Redis) -> None:
    phone = message.contact.phone_number if message.contact else None
    if not phone:
        await message.answer("Raqam olinmadi. Qayta urinib ko'ring.")
        return

    uid = message.from_user.id
    svc = UserSettings(redis)
    await svc.set_phone(uid, phone)

    data = await state.get_data()
    lang = data.get("lang", "uz")
    next_action = data.get("next_action", "")
    await state.clear()

    await message.answer("✅ Saqlandi!", reply_markup=main_menu_kb(lang, settings.WEBAPP_URL))

    if next_action == "active":
        await _show_active_orders(message, phone, lang)
    elif next_action == "history":
        await _show_history(message, phone, lang)
    elif next_action == "chat":
        await _do_chat_order_choose(message, state, phone, lang)


# ── Do'kon ────────────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_menu", "uz"), t("btn_menu", "ru")}))
async def open_shop(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🛍 Do'konni ochish", url=settings.WEBAPP_URL)
    ]])
    await message.answer(
        "🛍 <b>Do'kon</b>",
        parse_mode="HTML",
        reply_markup=kb,
    )


# ── Til ───────────────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_lang", "uz"), t("btn_lang", "ru")}))
async def choose_language(message: Message, redis: Redis) -> None:
    lang = await _lang(message, redis)
    await message.answer(t("choose_lang", lang), reply_markup=lang_kb())


@router.callback_query(F.data.startswith("setlang:"))
async def set_language(callback: CallbackQuery, redis: Redis) -> None:
    new_lang = callback.data.split(":")[1]
    uid = callback.from_user.id
    await UserSettings(redis).set_lang(uid, new_lang)
    await callback.message.edit_text(t("lang_changed", new_lang))
    await callback.message.answer(
        t("welcome", new_lang),
        parse_mode="HTML",
        reply_markup=main_menu_kb(new_lang, settings.WEBAPP_URL),
    )
    await callback.answer()


# ── Orders helpers ────────────────────────────────────────────────────────────

async def _show_active_orders(message: Message, phone: str, lang: str) -> None:
    try:
        orders = await api_client.get_customer_orders(phone, active_only=True)
        active = [o for o in orders if o.get("status") in ACTIVE_STATUSES]
        if not active:
            await message.answer(t("no_active_orders", lang))
            return
        lines = [t("active_orders_title", lang)]
        for o in active[:10]:
            lines.append(f"• {fmt_order_line(o, lang)}")
        await message.answer("\n".join(lines), parse_mode="HTML")
    except Exception:
        logger.exception("active_orders phone=%s", phone)
        await message.answer(t("orders_error", lang))


async def _show_history(message: Message, phone: str, lang: str) -> None:
    try:
        orders = await api_client.get_customer_orders(phone)
        done = [o for o in orders if o.get("status") in DONE_STATUSES]
        if not done:
            await message.answer(t("no_history", lang))
            return
        lines = [t("history_title", lang)]
        for o in done[:15]:
            lines.append(f"• {fmt_order_line(o, lang)}")
        await message.answer("\n".join(lines), parse_mode="HTML")
    except Exception:
        logger.exception("order_history phone=%s", phone)
        await message.answer(t("orders_error", lang))


# ── Aktiv buyurtmalar ────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_active_orders", "uz"), t("btn_active_orders", "ru")}))
async def active_orders(message: Message, state: FSMContext, redis: Redis) -> None:
    lang = await _lang(message, redis)
    phone = await _get_phone(message.from_user.id, redis)
    if not phone:
        await state.set_state(AppState.waiting_phone)
        await state.update_data(next_action="active", lang=lang)
        await message.answer("📱 Telefon raqamingizni ulashing:", reply_markup=_phone_kb())
        return
    await _show_active_orders(message, phone, lang)


# ── Tarix ─────────────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_history", "uz"), t("btn_history", "ru")}))
async def order_history(message: Message, state: FSMContext, redis: Redis) -> None:
    lang = await _lang(message, redis)
    phone = await _get_phone(message.from_user.id, redis)
    if not phone:
        await state.set_state(AppState.waiting_phone)
        await state.update_data(next_action="history", lang=lang)
        await message.answer("📱 Telefon raqamingizni ulashing:", reply_markup=_phone_kb())
        return
    await _show_history(message, phone, lang)


async def _do_chat_order_choose(message: Message, state: FSMContext, phone: str, lang: str) -> None:
    try:
        orders = await api_client.get_customer_orders(phone, active_only=True)
        active = [o for o in orders if o.get("status") in ACTIVE_STATUSES]
    except Exception:
        logger.exception("_do_chat_order_choose phone=%s", phone)
        active = []

    if not active:
        await state.clear()
        await message.answer(
            t("no_orders_for_chat", lang),
            reply_markup=main_menu_kb(lang, settings.WEBAPP_URL),
        )
        return

    await state.set_state(AppState.choosing_order)
    await message.answer(
        t("choose_order_for_chat", lang),
        reply_markup=orders_for_chat_kb(active, lang),
    )


# ── Yordam / Chat ─────────────────────────────────────────────────────────────

@router.message(F.text.in_({t("btn_chat", "uz"), t("btn_chat", "ru")}))
async def support_menu(message: Message, state: FSMContext, redis: Redis) -> None:
    lang = await _lang(message, redis)
    await state.set_state(AppState.choosing_chat_type)
    await state.update_data(lang=lang)
    await message.answer(t("choose_chat_type", lang), reply_markup=chat_type_kb(lang))


@router.callback_query(AppState.choosing_chat_type, F.data == "chat:support")
async def chat_support(callback: CallbackQuery, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    await state.clear()
    await callback.message.edit_text(t("chat_support_link", lang), parse_mode="HTML")
    await callback.answer()


@router.callback_query(AppState.choosing_chat_type, F.data == "chat:order")
async def chat_order_choose(callback: CallbackQuery, state: FSMContext, redis: Redis) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    phone = await _get_phone(callback.from_user.id, redis)

    if not phone:
        await state.set_state(AppState.waiting_phone)
        await state.update_data(next_action="chat", lang=lang)
        await callback.message.edit_text("📱 Telefon raqamingizni ulashing:")
        await callback.message.answer("👇", reply_markup=_phone_kb())
        await callback.answer()
        return

    await _do_chat_order_choose(callback.message, state, phone, lang)


@router.callback_query(AppState.choosing_order, F.data.startswith("chat:sel:"))
async def chat_order_selected(callback: CallbackQuery, state: FSMContext, bot: Bot, redis: Redis) -> None:
    data = await state.get_data()
    lang = data.get("lang", "uz")
    order_id = callback.data.split(":", 2)[2]
    await state.clear()

    try:
        order = await api_client.get_order(order_id)
        seller_chat_id = order.get("tenantTelegramChatId")
        customer_name = callback.from_user.full_name
        customer_username = callback.from_user.username
        customer_id = callback.from_user.id
        order_num = order.get("orderNumber", order_id[:8])

        contact = f"@{customer_username}" if customer_username else f"ID: {customer_id}"
        seller_msg = (
            f"💬 <b>Mijozdan savol</b>\n\n"
            f"Buyurtma: <b>#{order_num}</b>\n"
            f"Mijoz: <b>{customer_name}</b>\n"
            f"Telegram: {contact}"
        )

        # Save to Redis for admin "💬 Mijoz savollari"
        slug = order.get("tenantSlug", "default")
        redis_key = f"admin:messages:{slug}"
        await redis.lpush(redis_key, seller_msg.replace("<b>", "").replace("</b>", ""))
        await redis.ltrim(redis_key, 0, 49)  # keep last 50

        if seller_chat_id:
            await bot.send_message(int(seller_chat_id), seller_msg, parse_mode="HTML")
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
