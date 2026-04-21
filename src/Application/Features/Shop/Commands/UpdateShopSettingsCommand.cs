using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Shop.Commands;

public record UpdateShopSettingsCommand(
    string ShopName,
    string OwnerName,
    string Phone,
    string PrimaryColor,
    long? TelegramChatId
) : IRequest;

public class UpdateShopSettingsCommandValidator : AbstractValidator<UpdateShopSettingsCommand>
{
    public UpdateShopSettingsCommandValidator()
    {
        RuleFor(x => x.ShopName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OwnerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Matches(@"^\+998\d{9}$")
            .WithMessage("Telefon +998XXXXXXXXX formatida bo'lsin.");
        RuleFor(x => x.PrimaryColor)
            .Matches(@"^#[0-9A-Fa-f]{6}$")
            .WithMessage("Rang #RRGGBB formatida bo'lsin.");
    }
}

public class UpdateShopSettingsCommandHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<UpdateShopSettingsCommand>
{
    public async Task Handle(UpdateShopSettingsCommand request, CancellationToken ct)
    {
        var shop = await db.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenant.TenantId, ct)
            ?? throw new NotFoundException(nameof(Tenant), tenant.TenantId);

        shop.ShopName = request.ShopName;
        shop.OwnerName = request.OwnerName;
        shop.Phone = request.Phone;
        shop.PrimaryColor = request.PrimaryColor;
        shop.TelegramChatId = request.TelegramChatId;
        shop.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
