using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Commands;

public record SubmitPaymentProofCommand(
    Guid OrderId,
    Stream FileStream,
    string FileName,
    string ContentType
) : IRequest<PaymentProofDto>;

public class SubmitPaymentProofCommandValidator : AbstractValidator<SubmitPaymentProofCommand>
{
    private static readonly string[] _allowed =
        ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    private const long MaxBytes = 5 * 1024 * 1024;

    public SubmitPaymentProofCommandValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(ct => _allowed.Contains(ct))
            .WithMessage("Faqat JPG, PNG, WebP yoki PDF qabul qilinadi.");
        RuleFor(x => x.FileStream)
            .Must(s => s.Length <= MaxBytes)
            .WithMessage("Fayl 5MB dan oshmasin.");
    }
}

public class SubmitPaymentProofCommandHandler(
    IAppDbContext db,
    IFileStorageService storage,
    IBotNotificationService bot,
    ITenantContext tenant)
    : IRequestHandler<SubmitPaymentProofCommand, PaymentProofDto>
{
    public async Task<PaymentProofDto> Handle(SubmitPaymentProofCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderId);

        if (order.PaymentMethod != PaymentMethod.CardTransfer)
            throw new ConflictException("Bu buyurtma uchun chek talab qilinmaydi.");

        if (order.PaymentStatus == PaymentStatus.Paid)
            throw new ConflictException("Buyurtma allaqachon to'langan.");

        var fileType = request.ContentType == "application/pdf"
            ? PaymentProofFileType.Pdf
            : PaymentProofFileType.Image;

        var url = await storage.UploadAsync(
            request.FileStream, request.FileName, request.ContentType,
            tenant.Slug, "payment", ct);

        var proof = new PaymentProof
        {
            TenantId = tenant.TenantId,
            OrderId = order.Id,
            FileUrl = url,
            FileType = fileType,
            Status = PaymentProofStatus.Pending
        };

        order.PaymentStatus = PaymentStatus.ProofSubmitted;
        order.UpdatedAt = DateTime.UtcNow;

        db.PaymentProofs.Add(proof);
        await db.SaveChangesAsync(ct);

        await bot.NotifyPaymentProofAsync(order, proof, ct);

        return new PaymentProofDto(
            proof.Id, proof.FileUrl, proof.FileType.ToString(),
            proof.Status.ToString(), proof.AdminNote, proof.CreatedAt);
    }
}
