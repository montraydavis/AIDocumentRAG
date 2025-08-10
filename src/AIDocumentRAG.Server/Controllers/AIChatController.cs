namespace AIDocumentRAG.Server.Controllers
{
    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Models.Requests;
    using AIDocumentRAG.Server.Models.Responses;

    using Markdig;

    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class AIChatController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;
        private readonly ILogger<AIChatController> _logger;

        public AIChatController(IAIChatService aiChatService, ILogger<AIChatController> logger)
        {
            _aiChatService = aiChatService;
            _logger = logger;
        }


        [HttpGet("ollama/models")]
        public async Task<string[]> GetOllamaModels()
        {
            OllamaSharp.OllamaApiClient ollamaClient = new OllamaSharp.OllamaApiClient(new HttpClient()
            {
                BaseAddress = new Uri("https://localhost:11434")
            });

            IEnumerable<OllamaSharp.Models.Model> models = await ollamaClient.ListLocalModelsAsync();

            return models.Select(m => m.Name).ToArray();
        }

        [HttpPost("chat")]
        public async Task<ActionResult<ApiResponse<AIChatResponse>>> ChatAsync([FromBody] AIChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return BadRequest(new ApiResponse<AIChatResponse>(
                        false, null, "Prompt cannot be empty"));
                }

                string response = Markdown.ToHtml(await _aiChatService.GenerateResponseAsync(request.Prompt, request.Servicer, request.Model));
                AIChatResponse chatResponse = new AIChatResponse(response);

                return Ok(new ApiResponse<AIChatResponse>(true, chatResponse));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat request");
                return StatusCode(500, new ApiResponse<AIChatResponse>(
                    false, null, "Error processing chat request", new[] { ex.Message }));
            }
        }

        [HttpPost("chat/stream")]
        public async Task ChatStreamAsync([FromBody] AIChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    Response.StatusCode = 400;
                    await Response.WriteAsync("Prompt cannot be empty");
                    return;
                }

                Response.ContentType = "text/plain; charset=utf-8";
                Response.Headers.Append("Cache-Control", "no-cache");
                Response.Headers.Append("Connection", "keep-alive");

                await foreach (string chunk in _aiChatService.GenerateResponseStreamAsync(request.Prompt, request.Servicer, request.Model))
                {
                    await Response.WriteAsync(chunk);
                    await Response.Body.FlushAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing streaming chat request");
                await Response.WriteAsync($"\nError: {ex.Message}");
            }
        }
    }
}