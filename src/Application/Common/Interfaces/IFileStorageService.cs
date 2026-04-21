namespace UzMarket.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string tenantSlug,
        string fileType,
        CancellationToken ct = default);

    Task DeleteAsync(string fileUrl, CancellationToken ct = default);
}
