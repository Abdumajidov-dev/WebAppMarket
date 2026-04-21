using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Queries;

public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDetailDto>;

public class GetOrderByIdQueryHandler(IAppDbContext db)
    : IRequestHandler<GetOrderByIdQuery, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(o => o.PaymentProofs.OrderByDescending(p => p.CreatedAt).Take(1))
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Order), request.Id);

        return MapToDetail(order);
    }

    internal static OrderDetailDto MapToDetail(Order o)
    {
        var proof = o.PaymentProofs.FirstOrDefault();
        return new OrderDetailDto(
            o.Id, o.OrderNumber, o.CustomerName, o.CustomerPhone,
            o.DeliveryAddress,
            o.Status.ToString(), o.PaymentMethod.ToString(), o.PaymentStatus.ToString(),
            o.TotalAmount, o.Notes,
            o.Items.Select(i => new OrderItemDto(
                i.ProductId,
                i.Product?.Name ?? "—",
                i.Product?.Images.FirstOrDefault(img => img.IsPrimary)?.Url
                    ?? i.Product?.Images.OrderBy(img => img.SortOrder).FirstOrDefault()?.Url,
                i.Quantity, i.UnitPrice, i.Total)).ToList(),
            proof is null ? null : new PaymentProofDto(
                proof.Id, proof.FileUrl, proof.FileType.ToString(),
                proof.Status.ToString(), proof.AdminNote, proof.CreatedAt),
            o.CreatedAt);
    }
}
