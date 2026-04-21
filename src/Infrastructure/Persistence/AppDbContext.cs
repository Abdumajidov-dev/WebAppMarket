using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;

namespace UzMarket.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
    : DbContext(options), IAppDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<PaymentSetting> PaymentSettings => Set<PaymentSetting>();
    public DbSet<PaymentProof> PaymentProofs => Set<PaymentProof>();

    private Guid CurrentTenantId => tenantContext.TenantId;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        builder.Entity<User>().HasQueryFilter(u => u.TenantId == CurrentTenantId && !u.IsDeleted);
        builder.Entity<Category>().HasQueryFilter(c => c.TenantId == CurrentTenantId && !c.IsDeleted);
        builder.Entity<Product>().HasQueryFilter(p => p.TenantId == CurrentTenantId && !p.IsDeleted);
        builder.Entity<Order>().HasQueryFilter(o => o.TenantId == CurrentTenantId && !o.IsDeleted);
        builder.Entity<PaymentSetting>().HasQueryFilter(ps => ps.TenantId == CurrentTenantId && !ps.IsDeleted);
        builder.Entity<PaymentProof>().HasQueryFilter(pp => pp.TenantId == CurrentTenantId && !pp.IsDeleted);
    }
}
