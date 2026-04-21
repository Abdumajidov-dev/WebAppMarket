namespace UzMarket.Application.Features.Products.DTOs;

public record ProductDto(
    Guid Id,
    string Name,
    string Slug,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    bool IsActive,
    string? PrimaryImageUrl,
    string? CategoryName,
    Guid? CategoryId
);

public record ProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    bool IsActive,
    Guid? CategoryId,
    string? CategoryName,
    List<ProductImageDto> Images,
    DateTime CreatedAt
);

public record ProductImageDto(
    Guid Id,
    string Url,
    int SortOrder,
    bool IsPrimary
);
