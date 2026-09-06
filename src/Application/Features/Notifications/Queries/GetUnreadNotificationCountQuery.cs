using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Application.Features.Notifications.Queries;

public record GetUnreadNotificationCountQuery : IRequest<int>;

public class GetUnreadNotificationCountQueryHandler(IAppDbContext db)
    : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    public Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken ct)
        => db.Notifications.AsNoTracking().CountAsync(n => !n.IsRead, ct);
}
