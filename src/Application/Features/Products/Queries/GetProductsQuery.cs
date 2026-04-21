using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Products.DTOs;

namespace UzMarket.Application.Features.Products.Queries;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? CategoryId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? InStockOnly = null
) : IRequest<PagedResponse<ProductDto>>;

public class GetProductsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetProductsQuery, PagedResponse<ProductDto>>
{
    public async Task<PagedResponse<ProductDto>> Handle(GetProductsQuery q, CancellationToken ct)
    {
        var query = db.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(p =>
                p.Name.ToLower().Contains(q.Search.ToLower()) ||
                (p.Description != null && p.Description.ToLower().Contains(q.Search.ToLower())));

        if (q.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == q.CategoryId);

        if (q.MinPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) >= q.MinPrice.Value);

        if (q.MaxPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) <= q.MaxPrice.Value);

        if (q.InStockOnly == true)
            query = query.Where(p => p.StockQuantity > 0);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.Price,
                p.DiscountPrice,
                p.StockQuantity,
                p.IsActive,
                p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                p.Category != null ? p.Category.Name : null,
                p.CategoryId))
            .ToListAsync(ct);

        return PagedResponse<ProductDto>.Ok(items, q.Page, q.PageSize, total);
    }
}
