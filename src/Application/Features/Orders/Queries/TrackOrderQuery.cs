using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Orders.Queries;

public record TrackOrderQuery(string OrderNumber) : IRequest<OrderDetailDto>;

public class TrackOrderQueryHandler(IAppDbContext db)
    : IRequestHandler<TrackOrderQuery, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(TrackOrderQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(o => o.PaymentProofs.OrderByDescending(p => p.CreatedAt).Take(1))
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderNumber);

        return GetOrderByIdQueryHandler.MapToDetail(order);
    }
}
