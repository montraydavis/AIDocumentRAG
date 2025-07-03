namespace AIDocumentRAG.Server.Services.ChatInference
{
    using System.Collections.Concurrent;

    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Models.Responses;

    using Microsoft.SemanticKernel;

    public class DocumentSummaryService : IDocumentSummaryService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DocumentSummaryService> _logger;
        private readonly ConcurrentDictionary<string, DocumentSummaryDto> _summaryCache = new();
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        public DocumentSummaryService(IServiceProvider serviceProvider, ILogger<DocumentSummaryService> logger)
        {
            this._serviceProvider = serviceProvider;
            this._logger = logger;
        }

        public async Task<string> GenerateSummaryAsync(string content, string fileName)
        {
            try
            {
                await this._semaphore.WaitAsync();

                // Check cache first
                if (this._summaryCache.TryGetValue(fileName, out DocumentSummaryDto? cachedSummary))
                {
                    this._logger.LogDebug("Returning cached summary for {FileName}", fileName);
                    return cachedSummary.Summary;
                }

                this._logger.LogInformation("Generating summary for {FileName}", fileName);

                using IServiceScope scope = this._serviceProvider.CreateScope();
                Kernel kernel = scope.ServiceProvider.GetRequiredService<Kernel>();

                string prompt = CreateSummaryPrompt(content, fileName);
                PromptExecutionSettings promptExecutionSettings = new PromptExecutionSettings()
                {
                    ServiceId = "openai",
                    ModelId = "gpt-4o-mini"
                };

                FunctionResult response = await kernel.InvokePromptAsync(prompt, new KernelArguments(promptExecutionSettings));
                string summary = response.ToString();

                // Cache the summary
                DocumentSummaryDto summaryDto = new DocumentSummaryDto(
                    fileName,
                    summary,
                    DateTime.UtcNow,
                    EstimateTokenCount(summary));

                this._summaryCache.TryAdd(fileName, summaryDto);

                this._logger.LogInformation("Generated summary for {FileName} ({TokenCount} tokens)",
                    fileName, summaryDto.TokenCount);

                return summary;
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error generating summary for {FileName}", fileName);
                return $"Unable to generate summary for {fileName}";
            }
            finally
            {
                this._semaphore.Release();
            }
        }

        public void GenerateSummaryInBackground(string content, string fileName)
        {
            try
            {
                // Don't generate if already cached
                if (this._summaryCache.ContainsKey(fileName))
                {
                    this._logger.LogDebug("Summary already cached for {FileName}", fileName);
                    return;
                }

                // Generate summary without blocking
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await this.GenerateSummaryAsync(content, fileName);
                        this._logger.LogInformation("Background summary generation completed for {FileName}", fileName);
                    }
                    catch (Exception ex)
                    {
                        this._logger.LogWarning(ex, "Background summary generation failed for {FileName}", fileName);
                    }
                });
            }
            catch (Exception ex)
            {
                this._logger.LogWarning(ex, "Failed to start background summary generation for {FileName}", fileName);
            }
        }

        public async Task<DocumentSummaryDto?> GetSummaryAsync(string fileName)
        {
            await Task.CompletedTask; // Make async for consistency
            this._summaryCache.TryGetValue(fileName, out DocumentSummaryDto? summary);
            return summary;
        }

        public async Task<IEnumerable<DocumentSummaryDto>> GetMultipleSummariesAsync(IEnumerable<string> fileNames)
        {
            await Task.CompletedTask; // Make async for consistency
            return fileNames
                .Where(fileName => this._summaryCache.ContainsKey(fileName))
                .Select(fileName => this._summaryCache[fileName])
                .ToList();
        }

        private static string CreateSummaryPrompt(string content, string fileName)
        {
            return $"""
                Please provide a concise summary of the following document.
                

                Document Name: {fileName}

                Requirements:
                - Keep the summary between 2-4 sentences
                - Focus on the main topics and key information
                - Use clear, professional language
                - Avoid technical jargon when possible

                Document Content:
                {content}

                Summary:
                """;
        }

        private static int EstimateTokenCount(string text)
        {
            // Simple estimation: ~4 characters per token
            return text.Length / 4;
        }
    }
}
