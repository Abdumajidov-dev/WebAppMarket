using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Categories.DTOs;

namespace UzMarket.Application.Features.Categories.Queries;

public record GetCategoriesQuery(bool AsTree = false) : IRequest<IEnumerable<CategoryTreeDto>>;

public class GetCategoriesQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCategoriesQuery, IEnumerable<CategoryTreeDto>>
{
    public async Task<IEnumerable<CategoryTreeDto>> Handle(GetCategoriesQuery request, CancellationToken ct)
    {
        var all = await db.Categories
            .AsNoTracking()
            .Include(c => c.Products.Where(p => p.IsActive && !p.IsDeleted))
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(ct);

        var roots = all.Where(c => c.ParentId == null).ToList();
        return roots.Select(r => BuildTree(r, all));
    }

    private static CategoryTreeDto BuildTree(
        Domain.Entities.Category node,
        List<Domain.Entities.Category> all)
    {
        var children = all
            .Where(c => c.ParentId == node.Id)
            .Select(c => BuildTree(c, all))
            .ToList();

        return new CategoryTreeDto(
            node.Id, node.Name, node.Slug,
            node.ParentId, node.SortOrder, children);
    }
}
