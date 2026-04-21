using UzMarket.Domain.Enums;

namespace UzMarket.Domain.Entities;

public class User : TenantEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Owner;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
