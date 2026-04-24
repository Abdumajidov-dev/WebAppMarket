using Microsoft.EntityFrameworkCore;
using UzMarket.Domain.Entities;

namespace UzMarket.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<PaymentSetting> PaymentSettings { get; }
    DbSet<PaymentProof> PaymentProofs { get; }
    DbSet<Banner> Banners { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
