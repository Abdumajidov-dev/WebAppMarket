using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Orders.DTOs;
using UzMarket.Domain.Enums;

namespace UzMarket.Application.Features.Orders.Queries;

public record GetOrdersQuery(
    int Page = 1,
    int PageSize = 20,
    OrderStatus? Status = null,
    DateTime? From = null,
    DateTime? To = null,
    string? Search = null
) : IRequest<PagedResponse<OrderDto>>;

public class GetOrdersQueryHandler(IAppDbContext db)
    : IRequestHandler<GetOrdersQuery, PagedResponse<OrderDto>>
{
    public async Task<PagedResponse<OrderDto>> Handle(GetOrdersQuery q, CancellationToken ct)
    {
        var query = db.Orders.AsNoTracking().AsQueryable();

        if (q.Status.HasValue)
            query = query.Where(o => o.Status == q.Status);

        if (q.From.HasValue)
            query = query.Where(o => o.CreatedAt >= q.From.Value);

        if (q.To.HasValue)
            query = query.Where(o => o.CreatedAt <= q.To.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(o =>
                o.OrderNumber.Contains(q.Search) ||
                o.CustomerName.ToLower().Contains(q.Search.ToLower()) ||
                o.CustomerPhone.Contains(q.Search));

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(o => new OrderDto(
                o.Id,
                o.OrderNumber,
                o.CustomerName,
                o.CustomerPhone,
                o.Status.ToString(),
                o.PaymentMethod.ToString(),
                o.PaymentStatus.ToString(),
                o.TotalAmount,
                o.Items.Count,
                o.CreatedAt))
            .ToListAsync(ct);

        return PagedResponse<OrderDto>.Ok(items, q.Page, q.PageSize, total);
    }
}
