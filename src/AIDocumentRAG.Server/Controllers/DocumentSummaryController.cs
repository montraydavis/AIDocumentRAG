namespace AIDocumentRAG.Server.Controllers
{
    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Models.Responses;

    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class DocumentSummaryController : ControllerBase
    {
        private readonly IDocumentSummaryService _summaryService;
        private readonly ILogger<DocumentSummaryController> _logger;

        public DocumentSummaryController(
            IDocumentSummaryService summaryService,
            ILogger<DocumentSummaryController> logger)
        {
            this._summaryService = summaryService;
            this._logger = logger;
        }

        [HttpGet("{fileName}")]
        public async Task<ActionResult<ApiResponse<SummaryResponse>>> GetSummaryAsync(string fileName)
        {
            try
            {
                DocumentSummaryDto? summary = await this._summaryService.GetSummaryAsync(fileName);

                if (summary == null)
                {
                    return this.NotFound(new ApiResponse<SummaryResponse>(
                        false, null, $"Summary not found for '{fileName}'"));
                }

                SummaryResponse response = new SummaryResponse(
                    summary.FileName,
                    summary.Summary,
                    summary.GeneratedAt);

                return this.Ok(new ApiResponse<SummaryResponse>(true, response));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving summary for {FileName}", fileName);
                return this.StatusCode(500, new ApiResponse<SummaryResponse>(
                    false, null, "Error retrieving summary", new[] { ex.Message }));
            }
        }

        [HttpPost("multiple")]
        public async Task<ActionResult<ApiResponse<MultipleSummariesResponse>>> GetMultipleSummariesAsync(
            [FromBody] IEnumerable<string> fileNames)
        {
            try
            {
                if (!fileNames.Any())
                {
                    return this.BadRequest(new ApiResponse<MultipleSummariesResponse>(
                        false, null, "File names list cannot be empty"));
                }

                IEnumerable<DocumentSummaryDto> summaries = await this._summaryService.GetMultipleSummariesAsync(fileNames);
                MultipleSummariesResponse response = new MultipleSummariesResponse(
                    summaries,
                    fileNames.Count());

                return this.Ok(new ApiResponse<MultipleSummariesResponse>(true, response));
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error retrieving multiple summaries");
                return this.StatusCode(500, new ApiResponse<MultipleSummariesResponse>(
                    false, null, "Error retrieving summaries", new[] { ex.Message }));
            }
        }
    }
}