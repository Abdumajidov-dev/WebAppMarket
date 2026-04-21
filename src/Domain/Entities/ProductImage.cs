namespace UzMarket.Domain.Entities;

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public bool IsPrimary { get; set; } = false;
}
