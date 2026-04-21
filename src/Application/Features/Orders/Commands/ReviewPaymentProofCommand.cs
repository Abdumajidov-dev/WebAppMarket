using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Commands;

public record ApprovePaymentProofCommand(Guid OrderId) : IRequest;
public record RejectPaymentProofCommand(Guid OrderId, string? AdminNote) : IRequest;

public class ApprovePaymentProofCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ApprovePaymentProofCommand>
{
    public async Task Handle(ApprovePaymentProofCommand request, CancellationToken ct)
    {
        var proof = await db.PaymentProofs
            .Include(p => p.Order)
            .Where(p => p.OrderId == request.OrderId && p.Status == PaymentProofStatus.Pending)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("PaymentProof", request.OrderId);

        proof.Status = PaymentProofStatus.Approved;
        proof.ReviewedAt = DateTime.UtcNow;
        proof.ReviewedBy = currentUser.IsAuthenticated ? currentUser.UserId : null;

        proof.Order.PaymentStatus = PaymentStatus.Paid;
        proof.Order.Status = OrderStatus.Confirmed;
        proof.Order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}

public class RejectPaymentProofCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<RejectPaymentProofCommand>
{
    public async Task Handle(RejectPaymentProofCommand request, CancellationToken ct)
    {
        var proof = await db.PaymentProofs
            .Include(p => p.Order)
            .Where(p => p.OrderId == request.OrderId && p.Status == PaymentProofStatus.Pending)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("PaymentProof", request.OrderId);

        proof.Status = PaymentProofStatus.Rejected;
        proof.AdminNote = request.AdminNote;
        proof.ReviewedAt = DateTime.UtcNow;
        proof.ReviewedBy = currentUser.IsAuthenticated ? currentUser.UserId : null;

        proof.Order.PaymentStatus = PaymentStatus.Failed;
        proof.Order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
