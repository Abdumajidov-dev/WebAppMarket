def fmt_price(amount: float) -> str:
    formatted = f"{amount:,.0f}".replace(",", " ")
    return f"{formatted} so'm"


def fmt_order(order: dict) -> str:
    status_labels = {
        "Pending": "⏳ Kutilmoqda",
        "Confirmed": "✅ Tasdiqlandi",
        "Processing": "🔧 Tayyorlanmoqda",
        "Shipped": "🚚 Yo'lda",
        "Delivered": "✅ Yetkazildi",
        "Cancelled": "❌ Bekor qilindi",
    }

    payment_labels = {
        "Cash": "Naqd pul",
        "CardTransfer": "Karta o'tkazma",
        "Payme": "Payme",
        "Click": "Click",
    }

    status = status_labels.get(order["status"], order["status"])
    payment = payment_labels.get(order["paymentMethod"], order["paymentMethod"])

    items_text = "\n".join(
        f"  • {i['productName']} × {i['quantity']} = {fmt_price(i['total'])}"
        for i in order.get("items", [])
    )

    text = (
        f"🛒 <b>Yangi buyurtma #{order['orderNumber']}</b>\n\n"
        f"👤 <b>Mijoz:</b> {order['customerName']}\n"
        f"📱 <b>Telefon:</b> {order['customerPhone']}\n"
        f"📍 <b>Manzil:</b> {order['deliveryAddress']}\n"
    )

    if order.get("notes"):
        text += f"📝 <b>Izoh:</b> {order['notes']}\n"

    text += (
        f"\n<b>Mahsulotlar:</b>\n{items_text}\n\n"
        f"💰 <b>Jami:</b> {fmt_price(order['totalAmount'])}\n"
        f"💳 <b>To'lov:</b> {payment}\n"
        f"📊 <b>Holat:</b> {status}"
    )
    return text


def fmt_product_card(product: dict) -> str:
    price = product.get("discountPrice") or product["price"]
    text = (
        f"🛍 <b>{product['name']}</b>\n\n"
        f"💰 <b>Narxi:</b> {fmt_price(price)}"
    )
    if product.get("discountPrice"):
        text += f"  <s>{fmt_price(product['price'])}</s>"
    if product.get("description"):
        text += f"\n\n{product['description']}"
    text += f"\n\n📦 Zaxira: {product['stockQuantity']} ta"
    return text
