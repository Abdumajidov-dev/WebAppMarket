namespace UzMarket.Application.Features.Banners.DTOs;

public record BannerDto(
    Guid Id,
    string Title,
    string? Subtitle,
    string? Emoji,
    string? ImageUrl,
    string? LinkUrl,
    string BgGradient,
    int SortOrder,
    bool IsActive
);
