using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Banners.Commands;
using UzMarket.Application.Features.Banners.DTOs;
using UzMarket.Application.Features.Banners.Queries;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/banners")]
public class BannersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBannersQuery(activeOnly), ct);
        return Ok(ApiResponse<IEnumerable<BannerDto>>.Ok(result));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBannerCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return Ok(ApiResponse<object>.Ok(new { id }));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBannerCommand command, CancellationToken ct)
    {
        if (id != command.Id)
            return BadRequest(ApiResponse<string>.Fail("ID mos kelmadi."));
        await mediator.Send(command, ct);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteBannerCommand(id), ct);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Fayl tanlanmagan."));

        var url = await mediator.Send(
            new UploadBannerImageCommand(id, file.OpenReadStream(), file.FileName, file.ContentType), ct);

        return Ok(ApiResponse<object>.Ok(new { url }));
    }
}
