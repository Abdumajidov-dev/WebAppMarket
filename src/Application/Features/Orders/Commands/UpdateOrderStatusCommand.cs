using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Enums;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus Status) : IRequest;

public class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class UpdateOrderStatusCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateOrderStatusCommand>
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> _allowed = new()
    {
        [OrderStatus.Pending]     = [OrderStatus.Confirmed, OrderStatus.Cancelled],
        [OrderStatus.Confirmed]   = [OrderStatus.Processing, OrderStatus.Cancelled],
        [OrderStatus.Processing]  = [OrderStatus.Shipped, OrderStatus.Cancelled],
        [OrderStatus.Shipped]     = [OrderStatus.Delivered],
        [OrderStatus.Delivered]   = [],
        [OrderStatus.Cancelled]   = []
    };

    public async Task Handle(UpdateOrderStatusCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderId);

        if (!_allowed[order.Status].Contains(request.Status))
            throw new ConflictException(
                $"'{order.Status}' statusidan '{request.Status}' ga o'tib bo'lmaydi.");

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
