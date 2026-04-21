using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Infrastructure.Services;

public class LocalFileStorageService(IWebHostEnvironment env, IConfiguration config)
    : IFileStorageService
{
    private readonly string _baseUrl = config["FileStorage:BaseUrl"] ?? "http://localhost:5000/uploads";
    private readonly string _basePath = Path.Combine(env.ContentRootPath,
        config["FileStorage:BasePath"] ?? "uploads");

    public async Task<string> UploadAsync(
        Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        Directory.CreateDirectory(_basePath);

        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(_basePath, uniqueName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs, ct);

        return $"{_baseUrl}/{uniqueName}";
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        var fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);
        var fullPath = Path.Combine(_basePath, fileName);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
