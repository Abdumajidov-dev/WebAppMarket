from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


def order_actions_kb(order_id: str, status: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    if status == "Pending":
        builder.row(
            InlineKeyboardButton(
                text="✅ Tasdiqlash",
                callback_data=f"order:confirm:{order_id}",
            ),
            InlineKeyboardButton(
                text="❌ Bekor qilish",
                callback_data=f"order:cancel:{order_id}",
            ),
        )
    elif status == "Confirmed":
        builder.row(
            InlineKeyboardButton(
                text="🔧 Tayyorlanmoqda",
                callback_data=f"order:processing:{order_id}",
            )
        )
    elif status == "Processing":
        builder.row(
            InlineKeyboardButton(
                text="🚚 Yo'lga chiqarildi",
                callback_data=f"order:ship:{order_id}",
            )
        )
    elif status == "Shipped":
        builder.row(
            InlineKeyboardButton(
                text="✅ Yetkazildi",
                callback_data=f"order:deliver:{order_id}",
            )
        )

    builder.row(
        InlineKeyboardButton(
            text="🔄 Yangilash",
            callback_data=f"order:refresh:{order_id}",
        )
    )
    return builder.as_markup()


def proof_actions_kb(order_id: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text="✅ Tasdiqlash",
            callback_data=f"proof:approve:{order_id}",
        ),
        InlineKeyboardButton(
            text="❌ Rad etish",
            callback_data=f"proof:reject:{order_id}",
        ),
    )
    return builder.as_markup()


def cancel_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚫 Bekor", callback_data="cancel")]
        ]
    )
