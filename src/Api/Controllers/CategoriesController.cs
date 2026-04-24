using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Categories.Commands;
using UzMarket.Application.Features.Categories.DTOs;
using UzMarket.Application.Features.Categories.Queries;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCategoriesQuery(), ct);
        return Ok(ApiResponse<IEnumerable<CategoryTreeDto>>.Ok(result));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return Ok(ApiResponse<object>.Ok(new { id }));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken ct)
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
        await mediator.Send(new DeleteCategoryCommand(id), ct);
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
            new UploadCategoryImageCommand(id, file.OpenReadStream(), file.FileName, file.ContentType), ct);

        return Ok(ApiResponse<object>.Ok(new { url }));
    }
}
