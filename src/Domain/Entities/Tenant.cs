using UzMarket.Domain.Enums;

namespace UzMarket.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public long? TelegramChatId { get; set; }
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#2563EB";
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Trial;
    public DateTime? SubscriptionEndsAt { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Product> Products { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
    public PaymentSetting? PaymentSetting { get; set; }
}
