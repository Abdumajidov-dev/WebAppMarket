using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Application.Features.Payment.Queries;

public record PaymentSettingsDto(
    string? CardNumber,
    string? CardHolder,
    string? BankName,
    string? Instructions,
    bool IsActive
);

public record GetPaymentSettingsQuery : IRequest<PaymentSettingsDto?>;

public class GetPaymentSettingsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPaymentSettingsQuery, PaymentSettingsDto?>
{
    public async Task<PaymentSettingsDto?> Handle(GetPaymentSettingsQuery request, CancellationToken ct)
    {
        var setting = await db.PaymentSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);

        if (setting is null) return null;

        return new PaymentSettingsDto(
            setting.CardNumber,
            setting.CardHolder,
            setting.BankName,
            setting.Instructions,
            setting.IsActive);
    }
}
