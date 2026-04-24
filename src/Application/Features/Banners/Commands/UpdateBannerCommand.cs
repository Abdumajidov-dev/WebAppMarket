using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UzMarket.Application.Common.Interfaces;
using UzMarket.Domain.Entities;
using UzMarket.Domain.Exceptions;

namespace UzMarket.Application.Features.Banners.Commands;

public record UpdateBannerCommand(
    Guid Id,
    string Title,
    string? Subtitle,
    string? Emoji,
    string? LinkUrl,
    string BgGradient,
    int SortOrder,
    bool IsActive
) : IRequest;

public class UpdateBannerCommandValidator : AbstractValidator<UpdateBannerCommand>
{
    public UpdateBannerCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class UpdateBannerCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateBannerCommand>
{
    public async Task Handle(UpdateBannerCommand request, CancellationToken ct)
    {
        var banner = await db.Banners.FirstOrDefaultAsync(b => b.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Banner), request.Id);

        banner.Title = request.Title;
        banner.Subtitle = request.Subtitle;
        banner.Emoji = request.Emoji;
        banner.LinkUrl = request.LinkUrl;
        banner.BgGradient = request.BgGradient;
        banner.SortOrder = request.SortOrder;
        banner.IsActive = request.IsActive;
        banner.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
