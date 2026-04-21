using System.Linq.Expressions;
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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            builder.Entity(entityType.ClrType).HasQueryFilter(
                BuildTenantFilter(entityType.ClrType));
        }
    }

    // Captures tenantContext instance (not its value) — filter re-evaluates per query
    private LambdaExpression BuildTenantFilter(Type entityType)
    {
        var param = Expression.Parameter(entityType, "e");

        var tenantIdProp = Expression.Property(param, nameof(TenantEntity.TenantId));
        var contextExpr = Expression.Constant(tenantContext, typeof(ITenantContext));
        var currentTenantId = Expression.Property(contextExpr, nameof(ITenantContext.TenantId));
        var tenantEqual = Expression.Equal(tenantIdProp, currentTenantId);

        var isDeletedProp = Expression.Property(param, nameof(TenantEntity.IsDeleted));
        var notDeleted = Expression.Equal(isDeletedProp, Expression.Constant(false));

        return Expression.Lambda(Expression.AndAlso(tenantEqual, notDeleted), param);
    }
}
