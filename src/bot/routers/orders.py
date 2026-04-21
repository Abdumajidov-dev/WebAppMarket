import logging
from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from keyboards.inline import order_actions_kb, cancel_kb
from services.api_client import api_client
from utils.formatters import fmt_order

router = Router()
logger = logging.getLogger(__name__)


class RejectProofState(StatesGroup):
    waiting_note = State()


STATUS_MAP = {
    "confirm": "Confirmed",
    "processing": "Processing",
    "ship": "Shipped",
    "deliver": "Delivered",
    "cancel": "Cancelled",
}


@router.callback_query(F.data.startswith("order:"))
async def handle_order_action(callback: CallbackQuery, state: FSMContext) -> None:
    _, action, order_id = callback.data.split(":", 2)

    if action == "refresh":
        try:
            order = await api_client.get_order(order_id)
            text = fmt_order(order)
            kb = order_actions_kb(order_id, order["status"])
            await callback.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
            await callback.answer("Yangilandi")
        except Exception:
            logger.exception("refresh order %s", order_id)
            await callback.answer("Xatolik", show_alert=True)
        return

    new_status = STATUS_MAP.get(action)
    if not new_status:
        await callback.answer("Noma'lum amal", show_alert=True)
        return

    try:
        await api_client.update_order_status(order_id, new_status)
        order = await api_client.get_order(order_id)
        text = fmt_order(order)
        kb = order_actions_kb(order_id, order["status"])
        await callback.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
        await callback.answer(f"Holat: {new_status}")
    except Exception:
        logger.exception("update order %s -> %s", order_id, new_status)
        await callback.answer("Xatolik yuz berdi", show_alert=True)


@router.callback_query(F.data.startswith("proof:"))
async def handle_proof_action(callback: CallbackQuery, state: FSMContext) -> None:
    _, action, order_id = callback.data.split(":", 2)

    if action == "approve":
        try:
            await api_client.approve_proof(order_id)
            await callback.message.edit_text(
                callback.message.html_text + "\n\n✅ <b>Chek tasdiqlandi</b>",
                parse_mode="HTML",
            )
            await callback.answer("Tasdiqlandi")
        except Exception:
            logger.exception("approve proof %s", order_id)
            await callback.answer("Xatolik", show_alert=True)

    elif action == "reject":
        await state.set_state(RejectProofState.waiting_note)
        await state.update_data(order_id=order_id, message_id=callback.message.message_id)
        await callback.message.reply(
            "❌ Rad etish sababini yozing:",
            reply_markup=cancel_kb(),
        )
        await callback.answer()


@router.message(RejectProofState.waiting_note)
async def receive_reject_note(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    order_id = data["order_id"]
    note = message.text or ""

    if not note.strip():
        await message.reply("Sabab bo'sh bo'lmasin. Qayta yozing:")
        return

    try:
        await api_client.reject_proof(order_id, note)
        await message.reply("✅ Chek rad etildi.")
        await state.clear()
    except Exception:
        logger.exception("reject proof %s", order_id)
        await message.reply("Xatolik yuz berdi.")


@router.callback_query(F.data == "cancel")
async def handle_cancel(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.delete()
    await callback.answer("Bekor qilindi")
