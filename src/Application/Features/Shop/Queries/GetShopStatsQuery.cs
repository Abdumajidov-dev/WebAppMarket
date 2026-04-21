using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Enums;

namespace UzMarket.Application.Features.Shop.Queries;

public record ShopStatsDto(
    int TodayOrderCount,
    decimal TodayRevenue,
    int WeekOrderCount,
    decimal WeekRevenue,
    int MonthOrderCount,
    decimal MonthRevenue,
    int TotalProducts,
    int LowStockCount
);

public record GetShopStatsQuery : IRequest<ShopStatsDto>;

public class GetShopStatsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetShopStatsQuery, ShopStatsDto>
{
    public async Task<ShopStatsDto> Handle(GetShopStatsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = todayStart.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1);

        var activeOrders = db.Orders
            .AsNoTracking()
            .Where(o => o.Status != OrderStatus.Cancelled);

        var todayOrders = await activeOrders
            .Where(o => o.CreatedAt >= todayStart)
            .Select(o => new { o.TotalAmount })
            .ToListAsync(ct);

        var weekOrders = await activeOrders
            .Where(o => o.CreatedAt >= weekStart)
            .Select(o => new { o.TotalAmount })
            .ToListAsync(ct);

        var monthOrders = await activeOrders
            .Where(o => o.CreatedAt >= monthStart)
            .Select(o => new { o.TotalAmount })
            .ToListAsync(ct);

        var totalProducts = await db.Products.CountAsync(p => p.IsActive, ct);
        var lowStock = await db.Products.CountAsync(p => p.IsActive && p.StockQuantity <= 5, ct);

        return new ShopStatsDto(
            todayOrders.Count, todayOrders.Sum(o => o.TotalAmount),
            weekOrders.Count, weekOrders.Sum(o => o.TotalAmount),
            monthOrders.Count, monthOrders.Sum(o => o.TotalAmount),
            totalProducts, lowStock);
    }
}
