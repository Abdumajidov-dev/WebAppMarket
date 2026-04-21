namespace UzMarket.Application.Common.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    string Slug { get; }
    string ShopName { get; }
    long? TelegramChatId { get; }
    bool IsResolved { get; }
}
