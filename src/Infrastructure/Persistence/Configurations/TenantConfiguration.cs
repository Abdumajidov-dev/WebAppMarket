using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UzMarket.Domain.Entities;

namespace UzMarket.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.Property(t => t.Slug).HasMaxLength(50).IsRequired();
        builder.Property(t => t.ShopName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.OwnerName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Phone).HasMaxLength(20).IsRequired();
        builder.Property(t => t.PrimaryColor).HasMaxLength(7);
        builder.Property(t => t.SubscriptionStatus).HasConversion<string>();

        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
