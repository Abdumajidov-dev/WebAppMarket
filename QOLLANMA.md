# UzMarket — Ishlatish Qo'llanmasi

---

## Bir marta o'rnatish (faqat birinchi safar)

### Talablar
- Docker Desktop o'rnatilgan va ishlab turgan bo'lishi kerak

### `.env` fayli yarating
Loyiha root papkasida (`docker-compose.yml` yonida):

```env
JWT_SECRET=uzmarket-super-secret-jwt-key-2024
BOT_TOKEN=your_telegram_bot_token_here
BOT_SECRET=uzmarket-bot-secret-2024
```

---

## Har kuni ishga tushirish

`start.ps1` faylini ishga tushiring:

```
O'ng klik → "Run with PowerShell"
```

Yoki PowerShell terminalda:
```powershell
.\start.ps1
```

**Script o'zi nima qiladi:**
1. Hamma Docker containerlarni ishga tushiradi
2. Cloudflare tunnel URL ni avtomatik oladi
3. URL o'zgargan bo'lsa bot ni yangilaydi
4. Barcha linklar va loginlarni ko'rsatadi

---

## Login ma'lumotlari

| Panel | Telefon | Parol |
|-------|---------|-------|
| SuperAdmin | +998882641919 | admin882641919 |
| Seller Admin | +998901234567 | seller123456 |

**Kirish URL lari (lokal tarmoq):**
- `http://10.100.104.114:3000/admin/login`
- `http://10.100.104.114:3000/superadmin/login`
- `http://10.100.104.114:3000` (do'kon)

---

## Arxitektura

```
Brauzer / Telefon (lokal tarmoq)
        │
        ▼  port 3000
   [Next.js Web]
        │
        ├── /api/v1/* ──► [ASP.NET API:5000] ──► [PostgreSQL]
        │                         │
        └── /media/*  ────────────┘──► [wwwroot/ rasmlar]

Telegram
   │
   ▼  polling
[Python Bot:8080] ──► [Redis] (FSM)
   │
   └── WebApp URL: [Cloudflare Tunnel] ──► [Next.js:3000]
```

> Brauzer faqat **port 3000** ga kiradi. Port 5000 tashqaridan ko'rinmaydi.

---

## Cloudflare Tunnel haqida

`trycloudflare.com` URL har restart da o'zgaradi. `start.ps1` bu URL ni avtomatik yangilaydi.

**Muammo:** `ERR_NAME_NOT_RESOLVED` — tunnel URL eskirgan
**Yechim:** `start.ps1` ni qayta ishga tushiring

---

## Muammolarni hal qilish

### Port band ("port already allocated")
```powershell
taskkill /f /im node.exe   # Next.js dev serverni to'xtatish
docker compose up -d web
```

### Containerlar to'xtagan
```powershell
docker compose up -d
```

### Rasm yuklanmayapti
- Admin → Products → mahsulotni tahrirlash → rasm yuklash
- Format: JPG, PNG, WebP, max 5MB

### Login saxlanmayapti / qayta loginni so'rayapti
- Brauzer localStorage ni tozalang (F12 → Application → Clear storage)
- Qayta kiring

### Bot javob bermayapti
```powershell
docker logs webappmarket-bot-1 --tail 50
```

---

## Foydali buyruqlar

```powershell
# Holat
docker compose ps

# Loglar
docker logs webappmarket-api-1 --tail 50
docker logs webappmarket-web-1 --tail 50
docker logs webappmarket-bot-1 --tail 50
docker logs webappmarket-cloudflared-1 --tail 20

# Hamma to'xtat
docker compose down

# Real-time loglar
docker compose logs -f

# Ma'lumotlar bazasi
docker exec -it webappmarket-postgres-1 psql -U postgres -d uzmarket
```
