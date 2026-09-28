using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace Company.Function;

public class HttpTriggerCsharp1
{
    private readonly ILogger<HttpTriggerCsharp1> _logger;

    public HttpTriggerCsharp1(ILogger<HttpTriggerCsharp1> logger)
    {
        _logger = logger;
    }

    [Function("HttpTriggerCsharp1")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");
        var name = req.Query["name"].ToString();
        var responseMessage = string.IsNullOrWhiteSpace(name)
            ? "This HTTP triggered function executed successfully. Pass a name in the query string."
            : $"Hello, {name}. This HTTP triggered function executed successfully.";

        return new OkObjectResult(responseMessage);
    }
}