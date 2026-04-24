namespace UzMarket.Domain.Entities;

public class Category : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public int SortOrder { get; set; } = 0;
    public string? ImageUrl { get; set; }

    public ICollection<Category> Children { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
}
