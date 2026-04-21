using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Shop.Queries;

public record ShopSettingsDto(
    string ShopName,
    string OwnerName,
    string Phone,
    string? LogoUrl,
    string PrimaryColor,
    long? TelegramChatId
);

public record GetShopSettingsQuery : IRequest<ShopSettingsDto>;

public class GetShopSettingsQueryHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<GetShopSettingsQuery, ShopSettingsDto>
{
    public async Task<ShopSettingsDto> Handle(GetShopSettingsQuery request, CancellationToken ct)
    {
        var shop = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenant.TenantId, ct)
            ?? throw new NotFoundException(nameof(Tenant), tenant.TenantId);

        return new ShopSettingsDto(
            shop.ShopName, shop.OwnerName, shop.Phone,
            shop.LogoUrl, shop.PrimaryColor, shop.TelegramChatId);
    }
}
