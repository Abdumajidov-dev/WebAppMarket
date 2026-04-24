using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Banners.DTOs;

namespace UzMarket.Application.Features.Banners.Queries;

public record GetBannersQuery(bool ActiveOnly = false) : IRequest<IEnumerable<BannerDto>>;

public class GetBannersQueryHandler(IAppDbContext db)
    : IRequestHandler<GetBannersQuery, IEnumerable<BannerDto>>
{
    public async Task<IEnumerable<BannerDto>> Handle(GetBannersQuery request, CancellationToken ct)
    {
        var query = db.Banners.AsNoTracking();
        if (request.ActiveOnly)
            query = query.Where(b => b.IsActive);

        return await query
            .OrderBy(b => b.SortOrder)
            .Select(b => new BannerDto(b.Id, b.Title, b.Subtitle, b.Emoji,
                b.ImageUrl, b.LinkUrl, b.BgGradient, b.SortOrder, b.IsActive))
            .ToListAsync(ct);
    }
}
