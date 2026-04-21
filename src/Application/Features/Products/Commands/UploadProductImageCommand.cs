using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Application.Features.Products.DTOs;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Products.Commands;

public record UploadProductImageCommand(
    Guid ProductId,
    Stream FileStream,
    string FileName,
    string ContentType,
    bool SetAsPrimary = false
) : IRequest<ProductImageDto>;

public class UploadProductImageCommandValidator : AbstractValidator<UploadProductImageCommand>
{
    private static readonly string[] _allowed = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxBytes = 5 * 1024 * 1024; // 5MB

    public UploadProductImageCommandValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(ct => _allowed.Contains(ct))
            .WithMessage("Faqat JPG, PNG, WebP formatlar qabul qilinadi.");

        RuleFor(x => x.FileStream)
            .Must(s => s.Length <= MaxBytes)
            .WithMessage("Fayl hajmi 5MB dan oshmasin.");
    }
}

public class UploadProductImageCommandHandler(IAppDbContext db, IFileStorageService storage)
    : IRequestHandler<UploadProductImageCommand, ProductImageDto>
{
    public async Task<ProductImageDto> Handle(UploadProductImageCommand request, CancellationToken ct)
    {
        var product = await db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var url = await storage.UploadAsync(
            request.FileStream, request.FileName, request.ContentType, ct);

        var nextOrder = product.Images.Any()
            ? product.Images.Max(i => i.SortOrder) + 1
            : 0;

        var isPrimary = request.SetAsPrimary || !product.Images.Any();

        if (isPrimary)
            foreach (var img in product.Images.Where(i => i.IsPrimary))
                img.IsPrimary = false;

        var image = new ProductImage
        {
            ProductId = product.Id,
            Url = url,
            SortOrder = nextOrder,
            IsPrimary = isPrimary
        };

        db.ProductImages.Add(image);
        await db.SaveChangesAsync(ct);

        return new ProductImageDto(image.Id, image.Url, image.SortOrder, image.IsPrimary);
    }
}
