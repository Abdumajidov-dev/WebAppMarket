using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using UzMarket.Application.Common.Interfaces;

namespace UzMarket.Infrastructure.Services;

public class LocalFileStorageService(IWebHostEnvironment env, IConfiguration configuration)
    : IFileStorageService
{
    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string tenantSlug,
        string fileType,
        CancellationToken ct = default)
    {
        var wwwroot = Path.Combine(env.ContentRootPath, "wwwroot");
        var folder = Path.Combine(wwwroot, "rasmlar", fileType);
        Directory.CreateDirectory(folder);

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(folder, uniqueName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs, ct);

        return $"/media/rasmlar/{fileType}/{uniqueName}";
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        try
        {
            // Handle both relative (/media/rasmlar/...) and absolute URLs
            string path;
            if (fileUrl.StartsWith("http://") || fileUrl.StartsWith("https://"))
            {
                var uri = new Uri(fileUrl);
                path = uri.AbsolutePath.TrimStart('/');
                if (path.StartsWith("media/", StringComparison.OrdinalIgnoreCase))
                    path = path["media/".Length..];
            }
            else
            {
                path = fileUrl.TrimStart('/');
                if (path.StartsWith("media/", StringComparison.OrdinalIgnoreCase))
                    path = path["media/".Length..];
            }

            var relativePath = path.Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(env.ContentRootPath, "wwwroot", relativePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
        catch { /* ignore delete errors */ }

        return Task.CompletedTask;
    }
}
