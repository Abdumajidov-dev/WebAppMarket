using UzMarket.Domain.Enums;

namespace UzMarket.Domain.Entities;

public class PaymentProof : TenantEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string FileUrl { get; set; } = string.Empty;
    public PaymentProofFileType FileType { get; set; }
    public PaymentProofStatus Status { get; set; } = PaymentProofStatus.Pending;
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedBy { get; set; }
}
