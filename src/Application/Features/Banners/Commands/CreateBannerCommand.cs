using FluentValidation;
using MediatR;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;

namespace UzMarket.Application.Features.Banners.Commands;

public record CreateBannerCommand(
    string Title,
    string? Subtitle,
    string? Emoji,
    string? LinkUrl,
    string BgGradient,
    int SortOrder,
    bool IsActive
) : IRequest<Guid>;

public class CreateBannerCommandValidator : AbstractValidator<CreateBannerCommand>
{
    public CreateBannerCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class CreateBannerCommandHandler(IAppDbContext db, ITenantContext tenant)
    : IRequestHandler<CreateBannerCommand, Guid>
{
    public async Task<Guid> Handle(CreateBannerCommand request, CancellationToken ct)
    {
        var banner = new Banner
        {
            TenantId = tenant.TenantId,
            Title = request.Title,
            Subtitle = request.Subtitle,
            Emoji = request.Emoji,
            LinkUrl = request.LinkUrl,
            BgGradient = request.BgGradient,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
        };
        db.Banners.Add(banner);
        await db.SaveChangesAsync(ct);
        return banner.Id;
    }
}
