using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;

namespace UzMarket.Application.Features.Payment.Commands;

public record UpdatePaymentSettingsCommand(
    string CardNumber,
    string CardHolder,
    string BankName,
    string? Instructions,
    bool IsActive
) : IRequest;

public class UpdatePaymentSettingsCommandValidator : AbstractValidator<UpdatePaymentSettingsCommand>
{
    public UpdatePaymentSettingsCommandValidator()
    {
        RuleFor(x => x.CardNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.CardHolder).NotEmpty().MaximumLength(200);
        RuleFor(x => x.BankName).NotEmpty().MaximumLength(100);
    }
}

public class UpdatePaymentSettingsCommandHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<UpdatePaymentSettingsCommand>
{
    public async Task Handle(UpdatePaymentSettingsCommand request, CancellationToken ct)
    {
        var setting = await db.PaymentSettings.FirstOrDefaultAsync(ct);

        if (setting is null)
        {
            db.PaymentSettings.Add(new PaymentSetting
            {
                TenantId = tenant.TenantId,
                CardNumber = request.CardNumber,
                CardHolder = request.CardHolder,
                BankName = request.BankName,
                Instructions = request.Instructions,
                IsActive = request.IsActive
            });
        }
        else
        {
            setting.CardNumber = request.CardNumber;
            setting.CardHolder = request.CardHolder;
            setting.BankName = request.BankName;
            setting.Instructions = request.Instructions;
            setting.IsActive = request.IsActive;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }
}
