using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Categories.Commands;

public record UploadCategoryImageCommand(
    Guid CategoryId,
    Stream FileStream,
    string FileName,
    string ContentType
) : IRequest<string>;

public class UploadCategoryImageCommandValidator : AbstractValidator<UploadCategoryImageCommand>
{
    private static readonly string[] _allowed = ["image/jpeg", "image/png", "image/webp"];

    public UploadCategoryImageCommandValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(ct => _allowed.Contains(ct))
            .WithMessage("Faqat jpg, png, webp formatlar qabul qilinadi.");
    }
}

public class UploadCategoryImageCommandHandler(
    IAppDbContext db,
    IFileStorageService storage,
    ITenantContext tenantContext)
    : IRequestHandler<UploadCategoryImageCommand, string>
{
    public async Task<string> Handle(UploadCategoryImageCommand request, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
            ?? throw new NotFoundException(nameof(Category), request.CategoryId);

        if (!string.IsNullOrEmpty(category.ImageUrl))
            await storage.DeleteAsync(category.ImageUrl, ct);

        var url = await storage.UploadAsync(
            request.FileStream, request.FileName, request.ContentType,
            tenantContext.Slug, "categorylar", ct);

        category.ImageUrl = url;
        category.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return url;
    }
}
