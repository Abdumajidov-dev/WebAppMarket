using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UzMarket.Domain.Entities;

namespace UzMarket.Infrastructure.Persistence.Configurations;

public class PaymentSettingConfiguration : IEntityTypeConfiguration<PaymentSetting>
{
    public void Configure(EntityTypeBuilder<PaymentSetting> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.CardNumber).HasMaxLength(20).IsRequired();
        builder.Property(p => p.CardHolder).HasMaxLength(200).IsRequired();
        builder.Property(p => p.BankName).HasMaxLength(100).IsRequired();

        builder.HasOne(p => p.Tenant)
            .WithOne(t => t.PaymentSetting)
            .HasForeignKey<PaymentSetting>(p => p.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PaymentProofConfiguration : IEntityTypeConfiguration<PaymentProof>
{
    public void Configure(EntityTypeBuilder<PaymentProof> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => new { p.OrderId, p.Status });
        builder.Property(p => p.FileType).HasConversion<string>();
        builder.Property(p => p.Status).HasConversion<string>();

        builder.HasOne(p => p.Tenant)
            .WithMany()
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.UnitPrice).HasPrecision(12, 2);
        builder.Property(i => i.Total).HasPrecision(12, 2);

        builder.HasOne(i => i.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(t => t.Id);
        builder.HasIndex(t => t.TokenHash);
        builder.Property(t => t.TokenHash).HasMaxLength(200).IsRequired();
    }
}
