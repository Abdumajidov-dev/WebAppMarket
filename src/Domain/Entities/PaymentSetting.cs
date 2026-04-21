namespace UzMarket.Domain.Entities;

public class PaymentSetting : TenantEntity
{
    public string CardNumber { get; set; } = string.Empty;
    public string CardOwner { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
}
