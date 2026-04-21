using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Products.Commands;
using UzMarket.Application.Features.Products.DTOs;
using UzMarket.Application.Features.Products.Queries;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStockOnly = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetProductsQuery(page, pageSize, search, categoryId, minPrice, maxPrice, inStockOnly), ct);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductBySlugQuery(slug), ct);
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [Authorize]
    [HttpGet("id/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), ct);
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<object>.Ok(new { id }));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductCommand command, CancellationToken ct)
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
        await mediator.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/images")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(
        Guid id,
        IFormFile file,
        [FromQuery] bool setPrimary = false,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Fayl tanlanmagan."));

        var command = new UploadProductImageCommand(
            id, file.OpenReadStream(), file.FileName, file.ContentType, setPrimary);

        var result = await mediator.Send(command, ct);
        return Ok(ApiResponse<ProductImageDto>.Ok(result));
    }

    [Authorize]
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductImageCommand(id, imageId), ct);
        return NoContent();
    }
}
