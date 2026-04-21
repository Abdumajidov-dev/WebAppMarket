from aiogram.types import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo,
)
from utils.i18n import t


def main_menu_kb(lang: str, webapp_url: str) -> ReplyKeyboardMarkup:
    shop_btn = KeyboardButton(text=t("btn_menu", lang))
    return ReplyKeyboardMarkup(
        keyboard=[
            [shop_btn],
            [
                KeyboardButton(text=t("btn_active_orders", lang)),
                KeyboardButton(text=t("btn_history", lang)),
            ],
            [
                KeyboardButton(text=t("btn_chat", lang)),
                KeyboardButton(text=t("btn_lang", lang)),
            ],
        ],
        resize_keyboard=True,
    )


def shop_inline_kb(lang: str, webapp_url: str) -> InlineKeyboardMarkup | None:
    if webapp_url.startswith("https://"):
        btn = InlineKeyboardButton(
            text=t("btn_menu", lang),
            web_app=WebAppInfo(url=webapp_url),
        )
        return InlineKeyboardMarkup(inline_keyboard=[[btn]])
    return None


def lang_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🇺🇿 O'zbek", callback_data="setlang:uz"),
        InlineKeyboardButton(text="🇷🇺 Русский", callback_data="setlang:ru"),
    ]])


def chat_type_kb(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t("btn_chat_order", lang), callback_data="chat:order")],
        [InlineKeyboardButton(text=t("btn_chat_support", lang), callback_data="chat:support")],
        [InlineKeyboardButton(text=t("btn_cancel", lang), callback_data="chat:cancel")],
    ])


def orders_for_chat_kb(orders: list, lang: str) -> InlineKeyboardMarkup:
    rows = []
    for o in orders[:8]:
        num = o.get("orderNumber", o.get("id", "")[:8])
        rows.append([InlineKeyboardButton(
            text=f"#{num}",
            callback_data=f"chat:sel:{o['id']}",
        )])
    rows.append([InlineKeyboardButton(text=t("btn_cancel", lang), callback_data="chat:cancel")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
