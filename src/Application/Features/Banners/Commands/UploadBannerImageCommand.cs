using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Banners.Commands;

public record UploadBannerImageCommand(
    Guid BannerId,
    Stream FileStream,
    string FileName,
    string ContentType
) : IRequest<string>;

public class UploadBannerImageCommandValidator : AbstractValidator<UploadBannerImageCommand>
{
    private static readonly string[] _allowed = ["image/jpeg", "image/png", "image/webp"];

    public UploadBannerImageCommandValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(ct => _allowed.Contains(ct))
            .WithMessage("Faqat jpg, png, webp formatlar qabul qilinadi.");
    }
}

public class UploadBannerImageCommandHandler(
    IAppDbContext db,
    IFileStorageService storage,
    ITenantContext tenantContext)
    : IRequestHandler<UploadBannerImageCommand, string>
{
    public async Task<string> Handle(UploadBannerImageCommand request, CancellationToken ct)
    {
        var banner = await db.Banners.FirstOrDefaultAsync(b => b.Id == request.BannerId, ct)
            ?? throw new NotFoundException(nameof(Banner), request.BannerId);

        if (!string.IsNullOrEmpty(banner.ImageUrl))
            await storage.DeleteAsync(banner.ImageUrl, ct);

        var url = await storage.UploadAsync(
            request.FileStream, request.FileName, request.ContentType,
            tenantContext.Slug, "bannerlar", ct);

        banner.ImageUrl = url;
        banner.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return url;
    }
}
