from __future__ import annotations
import logging

from aiogram import Router, F, Bot
from aiogram.filters import Command
from aiogram.types import (
    Message, CallbackQuery,
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton, WebAppInfo,
)
from redis.asyncio import Redis

from config import settings
from services.api_client import api_client

router = Router()
logger = logging.getLogger(__name__)

ADMIN_REDIS_KEY = "admin:chat_ids"
# Redis key for storing customer messages sent to admin
ADMIN_MESSAGES_KEY = "admin:messages:{slug}"


# ── Helpers ───────────────────────────────────────────────────────────────────

async def is_admin(chat_id: int, redis: Redis) -> bool:
    return await redis.hget(ADMIN_REDIS_KEY, str(chat_id)) is not None


async def get_slug(chat_id: int, redis: Redis) -> str:
    val = await redis.hget(ADMIN_REDIS_KEY, str(chat_id))
    return val.decode() if val else "default"


async def register_admin_chat(chat_id: int, slug: str, redis: Redis) -> None:
    await redis.hset(ADMIN_REDIS_KEY, str(chat_id), slug)


def admin_menu_kb() -> ReplyKeyboardMarkup:
    admin_url = f"{settings.WEBAPP_URL}/admin/dashboard"
    if admin_url.startswith("https://"):
        shop_btn = KeyboardButton(
            text="🏪 Do'kon",
            web_app=WebAppInfo(url=admin_url),
        )
    else:
        shop_btn = KeyboardButton(text="🏪 Do'kon")

    return ReplyKeyboardMarkup(
        keyboard=[
            [shop_btn],
            [KeyboardButton(text="🔔 Buyurtmalar"), KeyboardButton(text="📊 Statistika")],
            [KeyboardButton(text="💬 Mijoz savollari")],
        ],
        resize_keyboard=True,
    )


STATUS_META = [
    ("Pending",    "🕐", "Kutilmoqda"),
    ("Confirmed",  "✅", "Tasdiqlangan"),
    ("Processing", "⚙️", "Jarayonda"),
    ("Shipped",    "🚚", "Yo'lda"),
    ("Delivered",  "🎉", "Yetkazilgan"),
    ("Cancelled",  "❌", "Bekor"),
]


def status_overview_kb(orders: list) -> InlineKeyboardMarkup:
    from collections import Counter
    counts = Counter(o.get("status") for o in orders)
    total = len(orders)
    rows = []
    for status, icon, label in STATUS_META:
        n = counts.get(status, 0)
        badge = f"  ‼️" if status == "Pending" and n > 0 else ""
        rows.append([InlineKeyboardButton(
            text=f"{icon} {label} — {n} ta{badge}",
            callback_data=f"adm_status:{status}",
        )])
    rows.append([
        InlineKeyboardButton(text=f"📋 Barchasi — {total} ta", callback_data="adm_status:ALL"),
        InlineKeyboardButton(text="🔄", callback_data="adm_refresh"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def orders_list_kb(orders: list, back_cb: str = "adm_refresh") -> InlineKeyboardMarkup:
    buttons = []
    for o in orders[:12]:
        icon = {s: i for s, i, _ in STATUS_META}.get(o.get("status", ""), "📦")
        num = o.get("orderNumber", o["id"][:8])
        amount = f"{o.get('totalAmount', 0):,.0f}"
        buttons.append([InlineKeyboardButton(
            text=f"{icon} #{num} — {amount} so'm",
            callback_data=f"adm_order:{o['id']}",
        )])
    buttons.append([InlineKeyboardButton(text="◀️ Orqaga", callback_data=back_cb)])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


# ── Commands ──────────────────────────────────────────────────────────────────

@router.message(Command("myid"))
async def cmd_myid(message: Message) -> None:
    await message.answer(
        f"🪪 Sizning Telegram Chat ID:\n<code>{message.chat.id}</code>\n\n"
        "Admin panelda <b>Sozlamalar → Telegram Chat ID</b> maydoniga kiriting.",
        parse_mode="HTML",
    )


@router.message(Command("admin"))
async def cmd_admin(message: Message, redis: Redis) -> None:
    chat_id = message.chat.id
    if not await is_admin(chat_id, redis):
        # Try to auto-register from DB
        slug = await api_client.get_tenant_slug_by_chat_id(chat_id)
        if slug:
            await register_admin_chat(chat_id, slug, redis)
            logger.info("Auto-registered admin chat_id=%s slug=%s", chat_id, slug)
        else:
            await message.answer(
                "⚠️ <b>Admin paneli ulangan emas</b>\n\n"
                "Buyurtmalar bildirishnomasi olish uchun:\n"
                "1️⃣ Admin panelga kiring\n"
                "2️⃣ <b>Sozlamalar → Telegram Chat ID</b>\n"
                f"3️⃣ Quyidagi raqamni kiriting: <code>{chat_id}</code>",
                parse_mode="HTML",
            )
            return
    await message.answer(
        "🏪 <b>Admin paneli</b>\n\nXush kelibsiz!",
        parse_mode="HTML",
        reply_markup=admin_menu_kb(),
    )


# ── "Do'kon" fallback (when URL is not https) ─────────────────────────────────

@router.message(F.text == "🏪 Do'kon")
async def admin_shop(message: Message, redis: Redis) -> None:
    if not await is_admin(message.chat.id, redis):
        return
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🏪 Admin panelni ochish",
            url=f"{settings.WEBAPP_URL}/admin/dashboard",
        )
    ]])
    await message.answer("Admin panelga o'ting:", reply_markup=kb)


# ── Buyurtmalar ───────────────────────────────────────────────────────────────

def _orders_header(orders: list) -> str:
    from collections import Counter
    counts = Counter(o.get("status") for o in orders)
    pending = counts.get("Pending", 0)
    lines = ["🔔 <b>Buyurtmalar holati</b>"]
    if pending:
        lines.append(f"\n‼️ <b>{pending} ta yangi buyurtma kutilmoqda!</b>")
    lines.append(f"\nJami: <b>{len(orders)} ta</b>")
    return "\n".join(lines)


@router.message(F.text == "🔔 Buyurtmalar")
async def admin_orders(message: Message, redis: Redis) -> None:
    if not await is_admin(message.chat.id, redis):
        return
    slug = await get_slug(message.chat.id, redis)
    try:
        orders = await api_client.get_orders_for_admin(slug=slug)
        if not orders:
            await message.answer("📭 Hozircha buyurtma yo'q.")
            return
        await message.answer(
            _orders_header(orders),
            parse_mode="HTML",
            reply_markup=status_overview_kb(orders),
        )
    except Exception:
        logger.exception("admin_orders chat=%s", message.chat.id)
        await message.answer("❌ Xatolik yuz berdi.")


# ── Statistika ────────────────────────────────────────────────────────────────

@router.message(F.text == "📊 Statistika")
async def admin_stats(message: Message, redis: Redis) -> None:
    if not await is_admin(message.chat.id, redis):
        return
    slug = await get_slug(message.chat.id, redis)
    try:
        orders = await api_client.get_orders_for_admin(slug=slug)
        total     = len(orders)
        pending   = sum(1 for o in orders if o.get("status") == "Pending")
        confirmed = sum(1 for o in orders if o.get("status") in ("Confirmed", "Processing"))
        delivered = sum(1 for o in orders if o.get("status") == "Delivered")
        revenue   = sum(o.get("totalAmount", 0) for o in orders if o.get("status") == "Delivered")
        await message.answer(
            f"📊 <b>Statistika</b>\n\n"
            f"📦 Jami: <b>{total}</b>\n"
            f"🕐 Kutilmoqda: <b>{pending}</b>\n"
            f"⚙️ Jarayonda: <b>{confirmed}</b>\n"
            f"🎉 Yetkazilgan: <b>{delivered}</b>\n\n"
            f"💰 Tushum: <b>{revenue:,.0f} so'm</b>",
            parse_mode="HTML",
        )
    except Exception:
        logger.exception("admin_stats chat=%s", message.chat.id)
        await message.answer("❌ Xatolik yuz berdi.")


# ── Mijoz savollari ───────────────────────────────────────────────────────────

@router.message(F.text == "💬 Mijoz savollari")
async def admin_messages(message: Message, redis: Redis) -> None:
    if not await is_admin(message.chat.id, redis):
        return
    slug = await get_slug(message.chat.id, redis)
    key = ADMIN_MESSAGES_KEY.format(slug=slug)
    # Read last 20 messages from Redis list
    raw = await redis.lrange(key, 0, 19)
    if not raw:
        await message.answer(
            "💬 <b>Mijoz savollari</b>\n\n"
            "Hozircha xabar yo'q.\n"
            "<i>Mijoz buyurtmasi haqida savol yuborganda bu yerda ko'rinadi.</i>",
            parse_mode="HTML",
        )
        return
    lines = ["💬 <b>Mijoz savollari (oxirgi 20 ta):</b>\n"]
    for item in raw:
        lines.append(item.decode())
    await message.answer("\n".join(lines), parse_mode="HTML")


# ── Inline callbacks ──────────────────────────────────────────────────────────

@router.callback_query(F.data == "adm_refresh")
async def adm_refresh(callback: CallbackQuery, redis: Redis) -> None:
    slug = await get_slug(callback.from_user.id, redis)
    try:
        orders = await api_client.get_orders_for_admin(slug=slug)
        await callback.message.edit_text(
            _orders_header(orders),
            parse_mode="HTML",
            reply_markup=status_overview_kb(orders),
        )
        await callback.answer("Yangilandi ✓")
    except Exception:
        await callback.answer("Xatolik", show_alert=True)


@router.callback_query(F.data.startswith("adm_status:"))
async def adm_status_filter(callback: CallbackQuery, redis: Redis) -> None:
    status = callback.data.split(":", 1)[1]
    slug = await get_slug(callback.from_user.id, redis)
    try:
        orders = await api_client.get_orders_for_admin(slug=slug)
        if status == "ALL":
            filtered = orders
            label = "Barcha buyurtmalar"
        else:
            filtered = [o for o in orders if o.get("status") == status]
            meta = {s: (i, l) for s, i, l in STATUS_META}
            icon, lbl = meta.get(status, ("📦", status))
            label = f"{icon} {lbl}"

        if not filtered:
            await callback.answer(f"Bu holatda buyurtma yo'q", show_alert=True)
            return

        text = (
            f"<b>{label}</b> — {len(filtered)} ta\n"
            f"{'─' * 20}\n"
            f"Eng so'nggi {min(len(filtered), 12)} ta:"
        )
        await callback.message.edit_text(
            text,
            parse_mode="HTML",
            reply_markup=orders_list_kb(filtered, back_cb="adm_back"),
        )
        await callback.answer()
    except Exception:
        logger.exception("adm_status_filter status=%s", status)
        await callback.answer("Xatolik", show_alert=True)


@router.callback_query(F.data == "adm_back")
async def adm_back(callback: CallbackQuery, redis: Redis) -> None:
    slug = await get_slug(callback.from_user.id, redis)
    try:
        orders = await api_client.get_orders_for_admin(slug=slug)
        await callback.message.edit_text(
            _orders_header(orders),
            parse_mode="HTML",
            reply_markup=status_overview_kb(orders),
        )
        await callback.answer()
    except Exception:
        await callback.answer("Xatolik", show_alert=True)


@router.callback_query(F.data.startswith("adm_order:"))
async def adm_order_detail(callback: CallbackQuery) -> None:
    order_id = callback.data.split(":", 1)[1]
    try:
        from utils.formatters import fmt_order
        from keyboards.inline import order_actions_kb
        order = await api_client.get_order(order_id)
        await callback.message.edit_text(
            fmt_order(order),
            reply_markup=order_actions_kb(order_id, order["status"]),
            parse_mode="HTML",
        )
        await callback.answer()
    except Exception:
        logger.exception("adm_order_detail %s", order_id)
        await callback.answer("Xatolik", show_alert=True)
