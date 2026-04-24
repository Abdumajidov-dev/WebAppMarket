using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using UzMarket.Api.Middlewares;
using UzMarket.Application;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Infrastructure;
using UzMarket.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:3001"];

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await SeedAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher>());
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseStaticFiles();
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher)
{
    // Platform tenant (superadmin)
    var platform = await db.Tenants.IgnoreQueryFilters()
        .FirstOrDefaultAsync(t => t.Slug == "platform");

    if (platform is null)
    {
        platform = new Tenant
        {
            Id = Guid.NewGuid(),
            Slug = "platform",
            ShopName = "UzMarket Platform",
            OwnerName = "Super Admin",
            Phone = "+998882641919",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Tenants.Add(platform);
        await db.SaveChangesAsync();
    }

    var superAdminUser = await db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.TenantId == platform.Id && u.Phone == "+998882641919");

    if (superAdminUser is null)
    {
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = platform.Id,
            Phone = "+998882641919",
            PasswordHash = hasher.Hash("admin882641919"),
            Role = UserRole.SuperAdmin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }
    else if (superAdminUser.Role != UserRole.SuperAdmin)
    {
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE \"Users\" SET \"Role\" = {0}, \"UpdatedAt\" = {1} WHERE \"Id\" = {2}",
            (int)UserRole.SuperAdmin, DateTime.UtcNow, superAdminUser.Id);
    }

    // Demo tenant (seller)
    var demoTenant = await db.Tenants.IgnoreQueryFilters()
        .FirstOrDefaultAsync(t => t.Slug == "default");

    if (demoTenant is null)
    {
        demoTenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Slug = "default",
            ShopName = "Demo Do'kon",
            OwnerName = "Do'kon Egasi",
            Phone = "+998901234567",
            IsActive = true,
            SubscriptionStatus = SubscriptionStatus.Trial,
            SubscriptionEndsAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Tenants.Add(demoTenant);
        await db.SaveChangesAsync();
    }

    var demoOwner = await db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.TenantId == demoTenant.Id && u.Phone == "+998901234567");

    if (demoOwner is null)
    {
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = demoTenant.Id,
            Phone = "+998901234567",
            PasswordHash = hasher.Hash("seller123456"),
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }
    else if (demoOwner.PasswordHash == "PLACEHOLDER")
    {
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE \"Users\" SET \"PasswordHash\" = {0}, \"Role\" = {1}, \"UpdatedAt\" = {2} WHERE \"Id\" = {3}",
            hasher.Hash("seller123456"), (int)UserRole.Owner, DateTime.UtcNow, demoOwner.Id);
    }

    // Link owner user to tenant
    if (demoTenant.OwnerUserId != demoOwner.Id)
    {
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE \"Tenants\" SET \"OwnerUserId\" = {0}, \"UpdatedAt\" = {1} WHERE \"Id\" = {2}",
            demoOwner.Id, DateTime.UtcNow, demoTenant.Id);
    }

    // Seed categories (clothing store)
    var existingCats = await db.Categories.IgnoreQueryFilters()
        .Where(c => c.TenantId == demoTenant.Id && !c.IsDeleted)
        .Select(c => new { c.Id, c.Slug })
        .ToListAsync();

    Guid catQiz, catOgil, catAyol, catAkses;

    if (!existingCats.Any())
    {
        catQiz   = Guid.NewGuid();
        catOgil  = Guid.NewGuid();
        catAyol  = Guid.NewGuid();
        catAkses = Guid.NewGuid();
        db.Categories.AddRange(
            new Category { Id = catQiz,   TenantId = demoTenant.Id, Name = "Qiz bolalar",    Slug = "qiz-bolalar",   SortOrder = 1, ImageUrl = "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=400&fit=crop&q=80", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = catOgil,  TenantId = demoTenant.Id, Name = "O'g'il bolalar", Slug = "ogil-bolalar",  SortOrder = 2, ImageUrl = "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop&q=80", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = catAyol,  TenantId = demoTenant.Id, Name = "Ayollar",        Slug = "ayollar",       SortOrder = 3, ImageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop&q=80", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = catAkses, TenantId = demoTenant.Id, Name = "Aksessuarlar",   Slug = "aksessuarlar",  SortOrder = 4, ImageUrl = "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400&h=400&fit=crop&q=80", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();
    }
    else
    {
        catQiz   = existingCats.FirstOrDefault(c => c.Slug == "qiz-bolalar")?.Id   ?? existingCats[0].Id;
        catOgil  = existingCats.FirstOrDefault(c => c.Slug == "ogil-bolalar")?.Id  ?? existingCats[0].Id;
        catAyol  = existingCats.FirstOrDefault(c => c.Slug == "ayollar")?.Id       ?? existingCats[0].Id;
        catAkses = existingCats.FirstOrDefault(c => c.Slug == "aksessuarlar")?.Id  ?? existingCats[0].Id;

        // Patch imageUrls if missing
        await db.Database.ExecuteSqlRawAsync(@"
            UPDATE ""Categories"" SET ""ImageUrl"" = CASE ""Slug""
                WHEN 'qiz-bolalar'  THEN 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=400&fit=crop&q=80'
                WHEN 'ogil-bolalar' THEN 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop&q=80'
                WHEN 'ayollar'      THEN 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop&q=80'
                WHEN 'aksessuarlar' THEN 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400&h=400&fit=crop&q=80'
            END
            WHERE ""TenantId"" = {0} AND ""ImageUrl"" IS NULL", demoTenant.Id);
    }

    // Seed 20 clothing products
    var prodCount = await db.Products.IgnoreQueryFilters()
        .CountAsync(p => p.TenantId == demoTenant.Id && !p.IsDeleted);

    if (prodCount < 20)
    {
        var now = DateTime.UtcNow;
        db.Products.AddRange(
            // Qiz bolalar (6)
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Qiz bolalar ko'ylagi (2-6 yosh)",    Slug = "qiz-koylagi-2-6",       Price = 89_000,  DiscountPrice = 69_000,  StockQuantity = 45, IsActive = true, Description = "Nafis ruffle ko'ylak, yumshoq paxta material. 2-3, 3-4, 4-5, 5-6 yosh o'lchamlari mavjud.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Qiz bolalar pijamasi (1-7 yosh)",    Slug = "qiz-pijama",            Price = 65_000,  DiscountPrice = null,    StockQuantity = 60, IsActive = true, Description = "Yumshoq paxta pijama, rasmli. Barcha o'lchamlar mavjud.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Bolalar kombinezoni (0-2 yosh)",     Slug = "bola-kombinezoni",      Price = 115_000, DiscountPrice = 95_000,  StockQuantity = 30, IsActive = true, Description = "Chaqaloqlar uchun yumshoq kombinezon, fermuar bilan. 62-86 sm.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Qiz bolalar shimli-kofta seti",     Slug = "qiz-shim-kofta-set",    Price = 129_000, DiscountPrice = null,    StockQuantity = 35, IsActive = true, Description = "2 qismli set: shim + kofta, yumshoq material, 1-6 yosh.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Qiz bolalar sport kostyumi",        Slug = "qiz-sport-kostyum",     Price = 149_000, DiscountPrice = 119_000, StockQuantity = 25, IsActive = true, Description = "Zamonaviy sport kostyum, gul naqshli, 3-8 yosh.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catQiz,   Name = "Qiz bolalar guppy ko'ylagi",        Slug = "qiz-guppy-koylagi",     Price = 95_000,  DiscountPrice = null,    StockQuantity = 40, IsActive = true, Description = "Bayram uchun guppy ko'ylak, kashtali, 2-7 yosh.", CreatedAt = now, UpdatedAt = now },
            // O'g'il bolalar (4)
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catOgil,  Name = "O'g'il bolalar futbolka (3 ta)",     Slug = "ogil-futbolka-3ta",     Price = 99_000,  DiscountPrice = 79_000,  StockQuantity = 55, IsActive = true, Description = "3 ta futbolkadan iborat set, turli ranglar, 2-8 yosh.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catOgil,  Name = "O'g'il bolalar jins shimi",         Slug = "ogil-jins-shim",        Price = 89_000,  DiscountPrice = 75_000,  StockQuantity = 40, IsActive = true, Description = "Sifatli jins shim, elastic bel, 2-8 yosh.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catOgil,  Name = "Bolalar sport to'plami",            Slug = "bola-sport-toplami",     Price = 159_000, DiscountPrice = 129_000, StockQuantity = 20, IsActive = true, Description = "Futbolka + shim + kofta, 3 qismli sport to'plami, 3-8 yosh.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catOgil,  Name = "O'g'il bolalar kurtka (kuz)",       Slug = "ogil-kurtka-kuz",       Price = 229_000, DiscountPrice = null,    StockQuantity = 18, IsActive = true, Description = "Kuz-bahor uchun yengil kurtka, 4-10 yosh.", CreatedAt = now, UpdatedAt = now },
            // Ayollar (8)
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar yozgi ko'ylagi",            Slug = "ayol-yozgi-koylagi",    Price = 189_000, DiscountPrice = 149_000, StockQuantity = 35, IsActive = true, Description = "Chiffon yozgi ko'ylak, turli ranglar. S, M, L, XL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar ofis bluzasi",              Slug = "ayol-ofis-bluza",       Price = 175_000, DiscountPrice = null,    StockQuantity = 30, IsActive = true, Description = "Klassik ofis bluzasi, 100% paxta. S-XXL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar keng yubkasi",              Slug = "ayol-keng-yubka",       Price = 155_000, DiscountPrice = 125_000, StockQuantity = 28, IsActive = true, Description = "Keng flowery yubka, midi uzunlik. S, M, L.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar ichki kiyim to'plami",      Slug = "ayol-ichki-kiyim-set",  Price = 129_000, DiscountPrice = 99_000,  StockQuantity = 50, IsActive = true, Description = "Yumshoq paxta ichki kiyim to'plami, 3 ta. S-XL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar sport leggings",            Slug = "ayol-sport-leggings",   Price = 115_000, DiscountPrice = null,    StockQuantity = 45, IsActive = true, Description = "Yuqori belli sport leggings, 4 tarafga cho'ziladi. XS-XL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar lozimi (2 ta)",             Slug = "ayol-lozim-2ta",        Price = 85_000,  DiscountPrice = null,    StockQuantity = 60, IsActive = true, Description = "Yumshoq va issiq lozim, 2 ta to'plam. S-XL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar qish kofta-sviteri",        Slug = "ayol-qish-sviter",      Price = 249_000, DiscountPrice = 199_000, StockQuantity = 20, IsActive = true, Description = "Qalin qish sviteri, yumshoq trikotaj. S-XL.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAyol,  Name = "Ayollar yozgi-kuz to'plami",        Slug = "ayol-yozgi-kuz-set",    Price = 329_000, DiscountPrice = 269_000, StockQuantity = 15, IsActive = true, Description = "Ko'ylak + yubka 2 qismli to'plam. S, M, L.", CreatedAt = now, UpdatedAt = now },
            // Aksessuarlar (2)
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAkses, Name = "Qiz bolalar sochbog'i to'plami",    Slug = "qiz-sochbogi-toplami",  Price = 35_000,  DiscountPrice = null,    StockQuantity = 80, IsActive = true, Description = "12 ta sochbog' to'plami, turli ranglar va o'lchamlar.", CreatedAt = now, UpdatedAt = now },
            new Product { Id = Guid.NewGuid(), TenantId = demoTenant.Id, CategoryId = catAkses, Name = "Ayollar qo'l sumkasi",              Slug = "ayol-qol-sumkasi",      Price = 199_000, DiscountPrice = 165_000, StockQuantity = 22, IsActive = true, Description = "Zamonaviy qo'l sumkasi, sun'iy charm, turli ranglar.", CreatedAt = now, UpdatedAt = now }
        );
        await db.SaveChangesAsync();
    }
}
