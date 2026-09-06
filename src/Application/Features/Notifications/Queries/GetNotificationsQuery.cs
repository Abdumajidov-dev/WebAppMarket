using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Notifications.DTOs;

namespace UzMarket.Application.Features.Notifications.Queries;

public record GetNotificationsQuery(
    int Page = 1,
    int PageSize = 20,
    bool UnreadOnly = false
) : IRequest<PagedResponse<NotificationDto>>;

public class GetNotificationsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetNotificationsQuery, PagedResponse<NotificationDto>>
{
    public async Task<PagedResponse<NotificationDto>> Handle(GetNotificationsQuery q, CancellationToken ct)
    {
        var query = db.Notifications.AsNoTracking().AsQueryable();

        if (q.UnreadOnly)
            query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.Type.ToString(),
                n.Title,
                n.Message,
                n.OrderId,
                n.IsRead,
                n.CreatedAt))
            .ToListAsync(ct);

        return PagedResponse<NotificationDto>.Ok(items, q.Page, q.PageSize, total);
    }
}
