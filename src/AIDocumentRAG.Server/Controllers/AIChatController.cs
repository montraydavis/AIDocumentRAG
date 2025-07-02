namespace AIDocumentRAG.Server.Controllers
{
    using AIDocumentRAG.Server.Models.Requests;
    using AIDocumentRAG.Server.Models.Responses;
    using AIDocumentRAG.Server.Services;

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
            this._aiChatService = aiChatService;
            this._logger = logger;
        }

        [HttpPost("chat")]
        public async Task<ActionResult<ApiResponse<AIChatResponse>>> ChatAsync([FromBody] AIChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return this.BadRequest(new ApiResponse<AIChatResponse>(
                        false, null, "Prompt cannot be empty"));
                }

                string response = Markdown.ToHtml(await this._aiChatService.GenerateResponseAsync(request.Prompt));
                AIChatResponse chatResponse = new AIChatResponse(response);

                return this.Ok(new ApiResponse<AIChatResponse>(true, chatResponse));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error processing chat request");
                return this.StatusCode(500, new ApiResponse<AIChatResponse>(
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
                    this.Response.StatusCode = 400;
                    await this.Response.WriteAsync("Prompt cannot be empty");
                    return;
                }

                this.Response.ContentType = "text/plain; charset=utf-8";
                this.Response.Headers.Append("Cache-Control", "no-cache");
                this.Response.Headers.Append("Connection", "keep-alive");

                await foreach (string chunk in this._aiChatService.GenerateResponseStreamAsync(request.Prompt))
                {
                    await this.Response.WriteAsync(chunk);
                    await this.Response.Body.FlushAsync();
                }
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error processing streaming chat request");
                await this.Response.WriteAsync($"\nError: {ex.Message}");
            }
        }
    }
}