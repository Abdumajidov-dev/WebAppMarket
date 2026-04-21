# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WebAppMarket** — multi-tenant SaaS marketplace for Uzbekistan. Each seller gets a subdomain (`seller.platform.uz`). Three components:

| Component | Tech | Location |
|-----------|------|----------|
| Backend API | ASP.NET Core + Clean Architecture + CQRS | `src/Api/` |
| Frontend storefront + admin | Next.js 14 + TypeScript + Tailwind | `src/Web/` |
| Telegram order bot | Python + Aiogram 3.x | `src/Bot/` |

---

## Backend (ASP.NET Core)

### Project Structure
```
src/
├── Api/                    # Controllers, Middlewares, Program.cs
├── Application/            # CQRS Features (Commands/Queries), DTOs, Interfaces
├── Domain/                 # Entities, Enums, Exceptions
└── Infrastructure/         # EF Core DbContext, Migrations, Repositories, Services
```

### Commands
```bash
# Run API
dotnet run --project src/Api

# Add EF migration (naming: YYYYMMDD_ShortDescription)
dotnet ef migrations add 20240215_AddProductSlug --project src/Infrastructure --startup-project src/Api

# Apply migrations
dotnet ef database update --project src/Infrastructure --startup-project src/Api

# Run tests
dotnet test

# Run single test
dotnet test --filter "FullyQualifiedName~ProductServiceTests.CreateProduct"
```

### Multi-Tenancy Rules
- Tenant resolved from subdomain via `TenantMiddleware` → `ITenantContext`
- **Never manually filter by `TenantId`** — `AppDbContext` global query filter handles it automatically for all `TenantEntity` subclasses
- Soft delete only: set `IsDeleted = true`, never `DELETE FROM`
- Migration names: `YYYYMMDD_ShortDescription`

### Key Patterns
- All entities inherit `BaseEntity` (Id, CreatedAt, UpdatedAt, IsDeleted) or `TenantEntity` (+ TenantId)
- CQRS via MediatR — controllers only call `_mediator.Send()`
- Validation via FluentValidation pipeline behavior
- All responses use `ApiResponse<T>` / `PagedResponse<T>` wrapper
- JWT: access token 15min, refresh token 7 days (HttpOnly cookie), claims include `TenantId`
- `AsNoTracking()` on read-only queries; `SaveChangesAsync()` once per transaction
- Always accept `CancellationToken` in async methods

---

## Frontend (Next.js)

### Commands
```bash
cd src/Web
npm install
npm run dev       # localhost:3000
npm run build
npm run lint
```

### Architecture
```
components/
├── ui/           # shadcn/ui base components
├── shop/         # ProductCard, ProductGrid, CartDrawer, CheckoutForm, OrderStatus
├── layout/       # Header, Footer, BottomNav
└── common/       # PriceTag, Badge, Rating, ImageGallery
```

**Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Storefront — catalog, categories, banners |
| `/product/[slug]` | Product detail + order |
| `/cart` | Cart |
| `/checkout` | Checkout form |
| `/order/[id]` | Order status tracking |
| `/admin/*` | Seller dashboard |

### Key Rules
- **Mobile-first** — design for 375px first, breakpoints secondary; touch targets ≥44×44px
- Price display always via `formatPrice()` from `utils/format.ts` → `"450 000 so'm"` format
- Always handle three states: `if (isLoading) return <Skeleton>`, `if (error) return <ErrorState>`, `if (!data.length) return <EmptyState>`
- Seller primary color via CSS variable `--primary` (tenant-customizable)
- Phone input mask: `+998 __ ___ __ __`
- No `any` — use `unknown` or specific types; API responses validated with Zod

---

## Telegram Bot (Aiogram 3.x)

### Commands
```bash
cd src/Bot
pip install -r requirements.txt

# Run (polling for dev)
python main.py

# Run with webhook (prod)
uvicorn main:app --host 0.0.0.0 --port 8080
```

### Architecture
```
bot/
├── main.py              # Entry point, webhook setup
├── config.py            # pydantic-settings (BOT_TOKEN, API_BASE_URL, etc.)
├── routers/             # orders.py, products.py, admin.py
├── keyboards/           # inline.py, reply.py
├── services/            # api_client.py (→ ASP.NET), notification.py
├── middlewares/         # auth.py, throttle.py
└── utils/               # formatters.py, validators.py
```

### Key Rules
- Parse mode always HTML (`<b>`, `<i>`, `<code>`)
- Callback data format: `entity:action:id` (colon-separated)
- FSM storage: Redis (even in development)
- Bot → API auth via `X-Bot-Secret` header
- ASP.NET notifies bot via `POST /internal/notify/order` (webhook secret validated)
- Graceful shutdown: close `ApiClient` in `on_shutdown`
- Rate limit: 1 request/second per user

### Bot Functions
1. Notify seller on new order with inline action buttons (confirm/cancel/processing)
2. Seller updates order status via callback buttons → API PATCH
3. `/share <product_id>` — format product card for channel posting
