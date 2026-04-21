using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UzMarket.Application.Common.Models;
using UzMarket.Application.Features.Auth.Commands;
using UzMarket.Application.Features.Auth.Queries;

namespace UzMarket.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    private const string RefreshTokenCookie = "refresh_token";

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);

        SetRefreshCookie(result.RefreshToken);

        return Ok(ApiResponse<object>.Ok(new
        {
            accessToken = result.AccessToken,
            user = result.User
        }));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var token = Request.Cookies[RefreshTokenCookie];
        if (string.IsNullOrEmpty(token))
            return Unauthorized(ApiResponse<string>.Fail("Refresh token topilmadi."));

        var accessToken = await mediator.Send(new RefreshTokenCommand(token), ct);

        return Ok(ApiResponse<object>.Ok(new { accessToken }));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var token = Request.Cookies[RefreshTokenCookie];
        if (!string.IsNullOrEmpty(token))
            await mediator.Send(new LogoutCommand(token), ct);

        Response.Cookies.Delete(RefreshTokenCookie);
        return Ok(ApiResponse<string>.Ok("Chiqildi."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var user = await mediator.Send(new GetMeQuery(), ct);
        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    private void SetRefreshCookie(string token)
    {
        Response.Cookies.Append(RefreshTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}
