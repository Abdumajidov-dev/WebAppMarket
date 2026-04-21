from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message) -> None:
    await message.answer(
        "👋 <b>UzMarket Bot</b>\n\n"
        "Yangi buyurtmalar va to'lov cheklari haqida xabar olasiz.\n\n"
        "Buyruqlar:\n"
        "/share &lt;id&gt; — mahsulot kartochkasini tayyorlash",
        parse_mode="HTML",
    )
