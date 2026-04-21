import logging
from aiogram import Bot
from keyboards.inline import order_actions_kb, proof_actions_kb
from utils.formatters import fmt_order

logger = logging.getLogger(__name__)


async def notify_new_order(bot: Bot, chat_id: int, order: dict) -> None:
    text = fmt_order(order)
    kb = order_actions_kb(order["id"], order["status"])
    try:
        await bot.send_message(chat_id, text, reply_markup=kb, parse_mode="HTML")
    except Exception:
        logger.exception("notify_new_order chat=%s order=%s", chat_id, order.get("id"))


async def notify_payment_proof(bot: Bot, chat_id: int, order: dict) -> None:
    proof = order.get("latestProof", {})
    file_url = proof.get("fileUrl", "")
    file_type = proof.get("fileType", "")
    order_id = order["id"]

    caption = (
        f"💳 <b>To'lov cheki keldi</b>\n"
        f"Buyurtma: <b>#{order['orderNumber']}</b>\n"
        f"Summa: <b>{order['totalAmount']:,.0f} so'm</b>"
    )
    kb = proof_actions_kb(order_id)

    try:
        if file_type == "application/pdf":
            await bot.send_document(
                chat_id,
                document=file_url,
                caption=caption,
                reply_markup=kb,
                parse_mode="HTML",
            )
        else:
            await bot.send_photo(
                chat_id,
                photo=file_url,
                caption=caption,
                reply_markup=kb,
                parse_mode="HTML",
            )
    except Exception:
        logger.exception(
            "notify_payment_proof chat=%s order=%s", chat_id, order_id
        )
        # fallback: send text only
        try:
            await bot.send_message(
                chat_id,
                caption + f"\n\n🔗 <a href='{file_url}'>Chekni ko'rish</a>",
                reply_markup=kb,
                parse_mode="HTML",
            )
        except Exception:
            logger.exception("notify_payment_proof fallback failed")
