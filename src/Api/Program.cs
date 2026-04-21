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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
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
}
