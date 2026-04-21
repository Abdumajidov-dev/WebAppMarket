# Backend Progress

## Status: Sprint 1 — Foundation DONE, Sprint 2 — In Progress

---

## DONE ✅

### Infrastructure
- Solution: `UzMarket.sln` — 4 projects wired (Domain → Application → Infrastructure → Api)
- .NET 10, Clean Architecture, CQRS via MediatR
- **Domain/Entities:** BaseEntity, TenantEntity, Tenant, Category, Product, ProductImage, Order, OrderItem, PaymentSetting, PaymentProof, User, RefreshToken
- **Domain/Enums:** OrderStatus, PaymentMethod, PaymentStatus, PaymentProofStatus, PaymentProofFileType, SubscriptionStatus, UserRole
- **Domain/Exceptions:** NotFoundException, ForbiddenException, ConflictException, DomainException
- **AppDbContext:** GlobalQueryFilter (TenantId + IsDeleted) — dynamic, re-evaluates per query
- **TenantMiddleware:** subdomain resolve + `X-Tenant-Slug` header for local dev
- **ExceptionMiddleware:** validation→400, notfound→404, forbidden→403, conflict→409
- **EF Configurations:** Tenant, Product, Order, User, Category
- **Migration:** `20260420_InitialSchema` created (not applied yet — needs PostgreSQL)
- **DI registered:** TenantContext, CurrentUser, JwtService, PasswordHasher (Singleton), LocalFileStorageService

### Application/Common
- `IAppDbContext`, `ITenantContext`, `ICurrentUser`, `IJwtService`, `IFileStorageService`, `IBotNotificationService`, `IPasswordHasher`
- `ApiResponse<T>`, `PagedResponse<T>`
- `ValidationBehaviour` (FluentValidation pipeline)

### Auth Feature
- `LoginCommand` → email+password → access token + refresh token (rotation)
- `RefreshTokenCommand` → cookie → revoke old → issue new access token
- `LogoutCommand` → revoke refresh token
- `GetMeQuery` → current user DTO
- `JwtService` → HS256, 15min access / 7day refresh
- `PasswordHasher` → BCrypt
- `CurrentUser` → reads claims from HttpContext
- `AuthController` → POST /api/v1/auth/login|refresh|logout, GET /api/v1/auth/me
- Refresh token in HttpOnly Secure Cookie

### Products Feature
- `GetProductsQuery` → paginated, filter: search, categoryId, minPrice, maxPrice, inStockOnly
- `GetProductBySlugQuery` → public, includes images + category
- `GetProductByIdQuery` → admin
- `CreateProductCommand` → auto-slug (unique), category validation
- `UpdateProductCommand` → update all fields
- `DeleteProductCommand` → soft delete
- `UploadProductImageCommand` → file validation (JPG/PNG/WebP, max 5MB), auto-primary if first
- `DeleteProductImageCommand` → delete file + promote next as primary
- `LocalFileStorageService` → saves to `uploads/` folder
- `ProductsController` → full CRUD + image endpoints

### Categories Feature
- `GetCategoriesQuery` → tree structure (recursive build)
- `CreateCategoryCommand` → auto-slug, parent validation
- `UpdateCategoryCommand` → circular parent guard
- `DeleteCategoryCommand` → blocks if children or products exist (ConflictException)
- `CategoriesController` → GET (public), POST/PUT/DELETE (Bearer)

---

### Orders Feature ✅
- `PlaceOrderCommand` — public, order number (ORD-YYYY-NNNNN), stock deduct, bot notify
- `UpdateOrderStatusCommand` — Bearer, state machine (allowed transitions)
- `SubmitPaymentProofCommand` — public, upload JPG/PNG/WebP/PDF, bot notify
- `ApprovePaymentProofCommand` — Bearer, → order Confirmed + Paid
- `RejectPaymentProofCommand` — Bearer, + admin note → Failed
- `GetOrdersQuery` — Bearer, paginated, filter status/date/search
- `GetOrderByIdQuery` — Bearer, full detail + proof
- `TrackOrderQuery` — public, by orderNumber
- `BotNotificationService` — HTTP POST to bot (fire-and-forget, never breaks order flow)
- EF Configs: PaymentSetting, PaymentProof, OrderItem, RefreshToken
- `OrdersController` — all endpoints

---

### Payment Settings ✅
- `GetPaymentSettingsQuery` — public (card info for checkout page)
- `UpdatePaymentSettingsCommand` — Bearer, upsert (create if first time)
- `PaymentController`

### Shop Feature ✅
- `GetShopSettingsQuery`, `UpdateShopSettingsCommand`
- `GetShopStatsQuery` — today/week/month orders + revenue, totalProducts, lowStock (≤5)
- `ShopController` — settings, stats, logo upload

### Bot Webhook ✅
- `BotWebhookController` — `/internal/orders/{id}/status`, `/internal/orders/{id}/payment-proof/approve|reject`
- `X-Bot-Secret` header validation (no JWT needed for bot)

### Docker ✅
- `src/Api/Dockerfile` — multi-stage build
- `docker-compose.yml` — postgres:16, redis:7, api

### Migrations ✅
- `20260420_InitialSchema`
- `20260421_PaymentAndConfigs`

---

## TODO 🔲

### Remaining (optional / v2)
- `IHostedService` — expired refresh token cleanup (cron)
- Rate limiting middleware (checkout 10/min, login 5/10min)
- Logo upload: resize to WebP (ImageSharp)
- MinIO/R2 swap for `IFileStorageService`
- Frontend (Next.js)
- Telegram bot (Python/Aiogram)
- Nginx config for subdomain routing
Commands:
- `PlaceOrderCommand` — public, creates order + items, calculates total, generates ORD-YYYY-NNNNN number, triggers bot notification
- `UpdateOrderStatusCommand` — Bearer, seller changes status
- `SubmitPaymentProofCommand` — public, uploads screenshot/PDF, sets payment_status=ProofSubmitted
- `ApprovePaymentProofCommand` — Bearer OR bot, approves proof → order Confirmed + Paid
- `RejectPaymentProofCommand` — Bearer OR bot, rejects + stores admin_note

Queries:
- `GetOrdersQuery` — Bearer, paginated, filter by status/date
- `GetOrderByIdQuery` — Bearer
- `TrackOrderQuery` — public, by orderNumber

Controller: `OrdersController`

### Payment Feature
- `GetPaymentSettingsQuery` — public, returns card info
- `UpdatePaymentSettingsCommand` — Bearer, admin sets card
- `PaymentController`

### Shop Feature
- `GetShopSettingsQuery`
- `UpdateShopSettingsCommand`
- `GetShopStatsQuery` — today/week/month sales
- `ShopController`

### Bot Integration
- `BotNotificationService` (Infrastructure) — HTTP POST to bot server
- `BotWebhookController` — `/internal/orders/notify`, `/internal/payment-proof/notify`
- Internal endpoints for bot → API: status update, payment approve/reject

### Infrastructure (remaining)
- EF Configurations for PaymentSetting, PaymentProof, RefreshToken, OrderItem, ProductImage
- `IHostedService` for expired refresh token cleanup

### Docker
- `Dockerfile` for Api
- `docker-compose.yml` — postgres, redis, api, nginx

---

## Key Decisions Made
- EF GlobalQueryFilter captures `ITenantContext` instance (not value) — re-evaluates per query
- Soft delete for ALL tenant entities — `IsDeleted = true` only
- Refresh token stored as BCrypt hash in DB — raw token in HttpOnly cookie
- `LocalFileStorageService` for MVP — swap with MinIO/R2 later via `IFileStorageService`
- Bot notified via HTTP POST to bot server (`IBotNotificationService`)
- `X-Tenant-Slug` header for local dev (no subdomain needed)
- CardTransfer payment: buyer uploads proof → admin approves via Telegram bot

## Run Commands
```bash
# Run API (needs PostgreSQL)
dotnet run --project src/Api

# Apply migrations
dotnet ef database update --project src/Infrastructure --startup-project src/Api

# Add migration
dotnet ef migrations add YYYYMMDD_Name --project src/Infrastructure --startup-project src/Api
```

## Packages Installed
- MediatR 14.1.0
- FluentValidation 12.1.1
- Microsoft.EntityFrameworkCore 10.0.6
- Npgsql.EntityFrameworkCore.PostgreSQL
- Microsoft.AspNetCore.Authentication.JwtBearer 10.0.6
- StackExchange.Redis
- BCrypt.Net-Next 4.1.0
- System.IdentityModel.Tokens.Jwt 8.17.0
- Swashbuckle.AspNetCore 10.1.7
