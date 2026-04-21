using System.ComponentModel.DataAnnotations.Schema;

namespace UzMarket.Domain.Entities;

public class PaymentSetting : TenantEntity
{
    public string CardNumber { get; set; } = string.Empty;
    [Column("CardOwner")]
    public string CardHolder { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
}
