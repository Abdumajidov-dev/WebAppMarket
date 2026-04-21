using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Products.Commands;

public record CreateProductCommand(
    string Name,
    string? Description,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    Guid? CategoryId,
    bool IsActive = true
) : IRequest<Guid>;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DiscountPrice)
            .LessThan(x => x.Price)
            .When(x => x.DiscountPrice.HasValue)
            .WithMessage("Chegirma narxi asosiy narxdan kichik bo'lishi kerak.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}

public class CreateProductCommandHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var slug = await GenerateUniqueSlugAsync(request.Name, ct);

        if (request.CategoryId.HasValue)
        {
            var exists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
            if (!exists) throw new NotFoundException(nameof(Category), request.CategoryId);
        }

        var product = new Product
        {
            TenantId = tenant.TenantId,
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            IsActive = request.IsActive
        };

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        return product.Id;
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = name.ToLower()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");

        var slug = baseSlug;
        var counter = 1;

        while (await db.Products.AnyAsync(p => p.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";

        return slug;
    }
}
