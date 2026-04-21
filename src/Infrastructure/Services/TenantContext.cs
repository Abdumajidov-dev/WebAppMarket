using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;

namespace UzMarket.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    private Tenant? _tenant;

    public Guid TenantId => _tenant?.Id ?? Guid.Empty;
    public string Slug => _tenant?.Slug ?? string.Empty;
    public string ShopName => _tenant?.ShopName ?? string.Empty;
    public long? TelegramChatId => _tenant?.TelegramChatId;
    public bool IsResolved => _tenant is not null;

    public void Set(Tenant tenant) => _tenant = tenant;
}
