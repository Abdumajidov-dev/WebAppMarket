namespace UzMarket.Domain.Entities;

public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
}
