using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Categories.Commands;

public record CreateCategoryCommand(
    string Name,
    Guid? ParentId,
    int SortOrder = 0
) : IRequest<Guid>;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}

public class CreateCategoryCommandHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<CreateCategoryCommand, Guid>
{
    public async Task<Guid> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        if (request.ParentId.HasValue)
        {
            var parentExists = await db.Categories.AnyAsync(c => c.Id == request.ParentId, ct);
            if (!parentExists) throw new NotFoundException(nameof(Category), request.ParentId);
        }

        var slug = await GenerateUniqueSlugAsync(request.Name, ct);

        var category = new Category
        {
            TenantId = tenant.TenantId,
            Name = request.Name,
            Slug = slug,
            ParentId = request.ParentId,
            SortOrder = request.SortOrder
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync(ct);

        return category.Id;
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = name.ToLower().Replace(" ", "-").Replace("'", "");
        var slug = baseSlug;
        var counter = 1;

        while (await db.Categories.AnyAsync(c => c.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";

        return slug;
    }
}
