namespace UzMarket.Domain.Entities;

public class Banner : TenantEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Emoji { get; set; }
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string BgGradient { get; set; } = "from-[#7B2FF7] to-[#4A00E0]";
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
