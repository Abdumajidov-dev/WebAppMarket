# UzMarket — Project Context

Full reference for Claude. Combines TZ v1 + payment system design + architectural decisions.

---

## Problem & Solution

Small/medium Uzbekistan businesses sell via Telegram (chaotic: lost orders, no catalog, no payment tracking). 

**Solution:** Each seller gets `seller.platform.uz` — professional mobile storefront. Orders → Telegram bot. One platform, many shops.

---

## Users

| User | Entry point | Core need |
|------|-------------|-----------|
| Seller | `/admin/*` + Telegram bot | Manage orders, products, see stats |
| Buyer | `seller.platform.uz` | Browse catalog, place order fast |
| Super Admin | (v2) | Platform oversight |

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Backend | ASP.NET Core 8 + C# | Dev experience, Clean Arch |
| Frontend | Next.js 14 + TS + Tailwind | Subdomain routing, mobile-first |
| Bot | Python 3.11 + Aiogram 3.x | Bot portfolio, async |
| DB | PostgreSQL + EF Core 8 | Multi-tenant, complex queries |
| Cache | Redis | Session, rate limit, bot FSM |
| Files | MinIO / Cloudflare R2 | Product images, payment proofs |
| Deploy | Docker Compose + Nginx | Learning goal, simple |

---

## Multi-Tenancy Architecture

**Resolution:** Subdomain → `TenantMiddleware` → `ITenantContext` → injected everywhere.

```
avazbek.platform.uz  → slug="avazbek" → TenantId (GUID)
zafar.platform.uz    → slug="zafar"   → TenantId (GUID)
```

**Critical rule:** NEVER manually filter by `TenantId` in queries. `AppDbContext` GlobalQueryFilter handles it automatically for all `TenantEntity` subclasses. Also filters `IsDeleted = false`.

**Soft delete only:** Set `IsDeleted = true`. Never `DELETE FROM`.

---

## Database Schema

### Core Tables

**tenants**
```
id UUID PK | slug VARCHAR(50) UNIQUE | shop_name | owner_name | phone
telegram_chat_id BIGINT | logo_url TEXT? | primary_color VARCHAR(7)
subscription_status ENUM(Active/Trial/Suspended) | subscription_ends_at?
is_active BOOL | created_at TIMESTAMPTZ
```

**products** *(TenantEntity)*
```
id | tenant_id FK | category_id FK? | name | slug | description?
price DECIMAL(12,2) | discount_price? | stock_quantity INT
is_active BOOL | is_deleted BOOL | created_at
```

**orders** *(TenantEntity)*
```
id | tenant_id FK | order_number VARCHAR(20) [ORD-2024-00042]
customer_name | customer_phone | delivery_address TEXT
status ENUM(Pending/Confirmed/Processing/Shipped/Delivered/Cancelled)
payment_method ENUM(Payme/Click/Cash/CardTransfer)
payment_status ENUM(Pending/Paid/Failed/AwaitingProof/ProofSubmitted)
total_amount DECIMAL(12,2) | notes TEXT? | created_at
```

**payment_settings** *(TenantEntity)*
```
id | tenant_id FK | card_number VARCHAR(20) | card_owner VARCHAR(200)
bank_name VARCHAR(100) | instructions TEXT? | is_active BOOL
```

**payment_proofs** *(TenantEntity)*
```
id | tenant_id FK | order_id FK | file_url TEXT | file_type ENUM(Image/PDF)
status ENUM(Pending/Approved/Rejected) | admin_note TEXT?
reviewed_at TIMESTAMP? | reviewed_by UUID? FK→users | created_at
```

### Supporting Tables

**categories** *(TenantEntity)*: `id | tenant_id | name | slug | parent_id? | sort_order`

**product_images**: `id | product_id FK | url | sort_order | is_primary BOOL`

**order_items**: `id | order_id FK | product_id FK | qty INT | unit_price | total`

**users** *(TenantEntity)*: `id | tenant_id | email | password_hash | role ENUM(Owner/Manager)`

**refresh_tokens**: `id | user_id FK | token_hash | expires_at | revoked_at?`

### Indexes
```sql
products: (tenant_id, is_active, is_deleted)
orders: (tenant_id, status, created_at DESC)
orders: (order_number) UNIQUE
tenants: (slug) UNIQUE
payment_proofs: (order_id, status)
```

---

## API Contracts

All endpoints: `/api/v1/` prefix. JWT Bearer auth. All responses: `ApiResponse<T>` or `PagedResponse<T>`.

Tenant resolved from subdomain — no tenant param in URLs.

### Auth
```
POST /auth/login          → access token + refresh cookie
POST /auth/refresh        → new access token (cookie)
POST /auth/logout         → revoke refresh token
GET  /auth/me             → current user info
```

### Products
```
GET    /products                    (public) catalog, filter+pagination
GET    /products/{slug}             (public) product detail
POST   /products                    (bearer) create
PUT    /products/{id}               (bearer) update
DELETE /products/{id}               (bearer) soft delete
POST   /products/{id}/images        (bearer) multipart upload
DELETE /products/{id}/images/{imgId}(bearer) remove image
```

### Orders
```
POST  /orders                       (public) place order
GET   /orders                       (bearer) list, filter by status
GET   /orders/{id}                  (bearer) detail
GET   /orders/track/{orderNumber}   (public) buyer tracking
PATCH /orders/{id}/status           (bearer) change status
```

### Payment
```
GET   /payment-settings             (public*) card info for checkout page
PUT   /payment-settings             (bearer) admin sets card
POST  /orders/{id}/payment-proof    (public) buyer uploads screenshot/PDF
GET   /orders/{id}/payment-proof    (bearer) admin views proof
PATCH /orders/{id}/payment-proof/approve  (bearer) admin approves → Confirmed
PATCH /orders/{id}/payment-proof/reject   (bearer) admin rejects + note
```

### Other
```
GET/POST/PUT/DELETE /categories     standard CRUD
GET/PUT             /shop/settings  shop config
POST                /shop/logo      logo upload
GET                 /shop/stats     today/week/month sales

POST  /internal/orders/notify       (X-Bot-Secret) new order → bot
PATCH /internal/orders/{id}/status  (X-Bot-Secret) bot updates status
POST  /internal/payment-proof/notify (X-Bot-Secret) proof uploaded → bot
PATCH /internal/payment-proof/{id}/review (X-Bot-Secret) bot approve/reject
```

---

## Payment Flow (Manual Card Transfer)

```
1. Buyer selects "Karta orqali to'lov" at checkout
2. Order created with payment_method=CardTransfer, payment_status=AwaitingProof
3. Buyer redirected to /payment/[orderId]
4. Page shows: card number, owner, bank, amount to transfer
5. Buyer transfers money, uploads screenshot/PDF
6. POST /orders/{id}/payment-proof → file saved to MinIO/R2
7. API → POST /internal/payment-proof/notify → Bot
8. Bot sends admin: proof image/PDF + [✅ Tasdiqlash] [❌ Rad etish]
9a. Admin approves → order.status=Confirmed, payment_status=Paid
9b. Admin rejects → payment_status=Failed, admin_note saved, buyer notified
```

Bot callback format: `payment:approve:{orderId}` | `payment:reject:{orderId}`

Admin Telegram message:
```
💳 To'lov cheki yuklandi
#ORD-2024-00042 | Jasur Toshmatov
Summa: 450 000 so'm
[chek rasmi/fayli biriktiriladi]
[✅ Tasdiqlash]  [❌ Rad etish]
```

---

## Order Status Flow

```
Pending → Confirmed → Processing → Shipped → Delivered
                ↘ Cancelled (any stage before Shipped)

CardTransfer path:
Pending(AwaitingProof) → Pending(ProofSubmitted) → Confirmed(Paid) → ...
```

---

## Backend Code Patterns

### Entity Hierarchy
```csharp
BaseEntity         { Id, CreatedAt, UpdatedAt, IsDeleted }
  └── TenantEntity { + TenantId, Tenant }
```

### CQRS via MediatR
- Controllers only call `_mediator.Send()`
- `Features/{Domain}/{Commands|Queries}/`
- Each command/query has its own handler + validator

### Response Wrappers
```csharp
ApiResponse<T>       { Success, Data, Message, Errors }
PagedResponse<T>     { + Page, PageSize, TotalCount, TotalPages }
```

### Always
- `AsNoTracking()` on read queries
- `SaveChangesAsync()` once per transaction
- `CancellationToken` in all async methods
- FluentValidation for all commands
- `ILogger` for important operations

### JWT
- Access token: 15 min, claims: `TenantId` + `UserId` + `Role`
- Refresh token: 7 days, HttpOnly Secure Cookie, rotation on refresh

---

## Security Rules

- Rate limit checkout: 10 req/min per IP
- Rate limit login: 5 attempts/10min → 15min block
- File upload: JPG/PNG/WebP/PDF only, max 5MB
- Bot webhook: `X-Bot-Secret` header validated every request
- Internal API: Docker internal network only (not exposed externally)
- XSS: all text fields sanitized

---

## Frontend Key Rules

- Mobile-first: design for 375px, breakpoints secondary
- Touch targets: ≥44×44px
- Price: always `formatPrice()` → `"450 000 so'm"`
- Tenant color: CSS var `--primary` (customizable per shop)
- Phone mask: `+998 __ ___ __ __`
- Always handle: loading → `<Skeleton>`, error → `<ErrorState>`, empty → `<EmptyState>`
- No `any` — use `unknown` or specific types
- API responses validated with Zod

---

## Bot Key Rules

- Parse mode: always HTML
- Callback data: `entity:action:id` (colon-separated)
- FSM storage: Redis (always, even dev)
- Bot→API: `X-Bot-Secret` header
- Rate limit: 1 req/sec per user
- Graceful shutdown: close `ApiClient` in `on_shutdown`

---

## Docker Services

| Service | Port | Image |
|---------|------|-------|
| nginx | 80, 443 | nginx:alpine |
| api | 5000 | custom/api |
| frontend | 3000 | custom/frontend |
| bot | 8080 | custom/bot |
| postgres | 5432 | postgres:16 |
| redis | 6379 | redis:7-alpine |
| minio | 9000 | minio/minio |

---

## MVP Roadmap

1. **Foundation** — DB schema, migrations, multi-tenant, JWT auth
2. **Backend core** — Products, Orders, Categories, file upload, Payment system
3. **Frontend buyer** — Storefront, product, cart, checkout, payment page
4. **Admin panel** — Dashboard, orders, products, settings
5. **Telegram bot** — Notifications, status buttons, payment proof flow
6. **Deploy** — Docker Compose, Nginx, SSL
7. **Polish** — Bug fix, perf, UX

**Current: Step 1 — Foundation**
