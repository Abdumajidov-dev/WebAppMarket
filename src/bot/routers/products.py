import logging
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message, InputMediaPhoto

from services.api_client import api_client
from utils.formatters import fmt_product_card

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("share"))
async def share_product(message: Message) -> None:
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2 or not parts[1].strip():
        await message.reply("Foydalanish: /share &lt;product_id&gt;", parse_mode="HTML")
        return

    product_id = parts[1].strip()
    try:
        product = await api_client.get_product(product_id)
    except Exception:
        logger.exception("get product %s", product_id)
        await message.reply("Mahsulot topilmadi.")
        return

    caption = fmt_product_card(product)
    image_url = product.get("primaryImageUrl")

    if image_url:
        await message.reply_photo(
            photo=image_url,
            caption=caption,
            parse_mode="HTML",
        )
    else:
        await message.reply(caption, parse_mode="HTML")
