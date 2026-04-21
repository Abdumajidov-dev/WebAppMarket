using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Products.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Products.Queries;

public record GetProductBySlugQuery(string Slug) : IRequest<ProductDetailDto>;

public class GetProductBySlugQueryHandler(IAppDbContext db)
    : IRequestHandler<GetProductBySlugQuery, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(GetProductBySlugQuery request, CancellationToken ct)
    {
        var product = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && p.IsActive, ct)
            ?? throw new NotFoundException(nameof(Product), request.Slug);

        return MapToDetail(product);
    }

    internal static ProductDetailDto MapToDetail(Domain.Entities.Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.Price, p.DiscountPrice,
        p.StockQuantity, p.IsActive, p.CategoryId,
        p.Category?.Name,
        p.Images.OrderBy(i => i.SortOrder)
            .Select(i => new ProductImageDto(i.Id, i.Url, i.SortOrder, i.IsPrimary))
            .ToList(),
        p.CreatedAt);
}
