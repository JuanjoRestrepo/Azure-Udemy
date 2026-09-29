using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace Cloudshikshak.Function;

public class BlobTriggerCSharp
{
    private readonly ILogger<BlobTriggerCSharp> _logger;

    public BlobTriggerCSharp(ILogger<BlobTriggerCSharp> logger)
    {
        _logger = logger;
    }

    [Function(nameof(BlobTriggerCSharp))]
    [BlobOutput("image-output/thumbnail-{name}.png", Connection = "afcmainstorageaccount_STORAGE")]
    public async Task<byte[]> Run(
        [BlobTrigger("image-input/{name}.jpg", Connection = "afcmainstorageaccount_STORAGE")] ReadOnlyMemory<byte> inputBytes,
        string name)
    {
        _logger.LogInformation("New image uploaded to image-input: {Name}.jpg", name);

        using var inputStream = new MemoryStream(inputBytes.ToArray());
        using var image = await Image.LoadAsync(inputStream);
        image.Mutate(context => context.Resize(new ResizeOptions
        {
            Size = new Size(100, 100),
            Mode = ResizeMode.Crop
        }));

        using var outputStream = new MemoryStream();
        await image.SaveAsPngAsync(outputStream);
        _logger.LogInformation("Created thumbnail image-output/thumbnail-{Name}.png", name);
        return outputStream.ToArray();
    }
}