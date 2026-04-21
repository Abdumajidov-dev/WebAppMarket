from __future__ import annotations

STRINGS: dict[str, dict[str, str]] = {
    # ── Start / Menu ──────────────────────────────────────────────────────────
    "welcome": {
        "uz": "👋 <b>UzMarket</b>ga xush kelibsiz!\n\nQuyidagi menyudan foydalaning:",
        "ru": "👋 Добро пожаловать в <b>UzMarket</b>!\n\nВоспользуйтесь меню ниже:",
    },
    "btn_menu": {
        "uz": "🛍 Do'kon",
        "ru": "🛍 Магазин",
    },
    "btn_lang": {
        "uz": "🌐 Tilni o'zgartirish",
        "ru": "🌐 Изменить язык",
    },
    "btn_active_orders": {
        "uz": "📦 Aktiv buyurtmalar",
        "ru": "📦 Активные заказы",
    },
    "btn_history": {
        "uz": "📋 Tarix",
        "ru": "📋 История",
    },
    "btn_chat": {
        "uz": "💬 Yordam",
        "ru": "💬 Помощь",
    },
    # ── Language ─────────────────────────────────────────────────────────────
    "choose_lang": {
        "uz": "🌐 Tilni tanlang:",
        "ru": "🌐 Выберите язык:",
    },
    "lang_changed": {
        "uz": "✅ Til o'zgartirildi: O'zbek",
        "ru": "✅ Язык изменён: Русский",
    },
    "btn_uz": {
        "uz": "🇺🇿 O'zbek",
        "ru": "🇺🇿 Узбекский",
    },
    "btn_ru": {
        "uz": "🇷🇺 Rus",
        "ru": "🇷🇺 Русский",
    },
    # ── Orders ───────────────────────────────────────────────────────────────
    "no_active_orders": {
        "uz": "📭 Faol buyurtmalaringiz yo'q.",
        "ru": "📭 У вас нет активных заказов.",
    },
    "no_history": {
        "uz": "📭 Buyurtmalar tarixi bo'sh.",
        "ru": "📭 История заказов пуста.",
    },
    "active_orders_title": {
        "uz": "📦 <b>Faol buyurtmalar:</b>",
        "ru": "📦 <b>Активные заказы:</b>",
    },
    "history_title": {
        "uz": "📋 <b>Buyurtmalar tarixi:</b>",
        "ru": "📋 <b>История заказов:</b>",
    },
    "orders_error": {
        "uz": "❌ Buyurtmalarni yuklashda xatolik. Keyinroq urinib ko'ring.",
        "ru": "❌ Ошибка загрузки заказов. Попробуйте позже.",
    },
    # ── Chat / Support ───────────────────────────────────────────────────────
    "choose_chat_type": {
        "uz": "💬 Qanday yordam kerak?",
        "ru": "💬 Какая нужна помощь?",
    },
    "btn_chat_order": {
        "uz": "🛒 Buyurtma bo'yicha",
        "ru": "🛒 По заказу",
    },
    "btn_chat_support": {
        "uz": "🖥 Dastur bo'yicha",
        "ru": "🖥 По программе",
    },
    "btn_cancel": {
        "uz": "🚫 Bekor qilish",
        "ru": "🚫 Отмена",
    },
    "chat_support_link": {
        "uz": "🖥 Dastur bo'yicha savollar uchun:\n👉 @Software_developman",
        "ru": "🖥 По вопросам программы:\n👉 @Software_developman",
    },
    "choose_order_for_chat": {
        "uz": "Qaysi buyurtma haqida savol berasiz?\nFaol buyurtmangizni tanlang:",
        "ru": "По какому заказу вопрос?\nВыберите активный заказ:",
    },
    "no_orders_for_chat": {
        "uz": "❗ Faol buyurtma topilmadi. Avval buyurtma bering.",
        "ru": "❗ Активных заказов не найдено. Сначала сделайте заказ.",
    },
    "seller_contact_sent": {
        "uz": "✅ Do'kon egasi siz bilan bog'lanadi. Kutib turing!",
        "ru": "✅ Владелец магазина свяжется с вами. Ожидайте!",
    },
    "seller_no_contact": {
        "uz": "❌ Do'kon egasining aloqa ma'lumotlari topilmadi.",
        "ru": "❌ Контактные данные владельца магазина не найдены.",
    },
    "cancelled": {
        "uz": "Bekor qilindi.",
        "ru": "Отменено.",
    },
}

ACTIVE_STATUSES = {"Pending", "Confirmed", "Processing", "Shipped"}
DONE_STATUSES = {"Delivered", "Cancelled"}

STATUS_LABELS: dict[str, dict[str, str]] = {
    "Pending":    {"uz": "⏳ Kutilmoqda",    "ru": "⏳ Ожидает"},
    "Confirmed":  {"uz": "✅ Tasdiqlandi",    "ru": "✅ Подтверждён"},
    "Processing": {"uz": "🔧 Tayyorlanmoqda", "ru": "🔧 Готовится"},
    "Shipped":    {"uz": "🚚 Yo'lda",         "ru": "🚚 В пути"},
    "Delivered":  {"uz": "✅ Yetkazildi",     "ru": "✅ Доставлен"},
    "Cancelled":  {"uz": "❌ Bekor qilindi",  "ru": "❌ Отменён"},
}


def t(key: str, lang: str = "uz") -> str:
    lang = lang if lang in ("uz", "ru") else "uz"
    return STRINGS.get(key, {}).get(lang, STRINGS.get(key, {}).get("uz", key))


def fmt_status(status: str, lang: str = "uz") -> str:
    return STATUS_LABELS.get(status, {}).get(lang, status)


def fmt_order_line(order: dict, lang: str = "uz") -> str:
    num = order.get("orderNumber", order.get("id", "")[:8])
    amount = order.get("totalAmount", 0)
    status = fmt_status(order.get("status", ""), lang)
    return f"#{num} — {amount:,.0f} so'm — {status}"
