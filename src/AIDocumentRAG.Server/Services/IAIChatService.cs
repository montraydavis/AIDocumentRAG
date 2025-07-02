namespace AIDocumentRAG.Server.Services
{
    using Microsoft.SemanticKernel;

    public interface IAIChatService
    {
        Task<string> GenerateResponseAsync(string prompt);
        IAsyncEnumerable<string> GenerateResponseStreamAsync(string prompt);
    }

    public class AIChatService : IAIChatService
    {
        private readonly Kernel _kernel;
        private readonly ILogger<AIChatService> _logger;

        public AIChatService(Kernel kernel, ILogger<AIChatService> logger)
        {
            this._kernel = kernel;
            this._logger = logger;
        }

        public async Task<string> GenerateResponseAsync(string prompt)
        {
            try
            {
                FunctionResult response = await this._kernel.InvokePromptAsync(prompt);
                return response.ToString();
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error generating AI response for prompt: {Prompt}", prompt);
                throw;
            }
        }

        public async IAsyncEnumerable<string> GenerateResponseStreamAsync(string prompt)
        {
            IAsyncEnumerable<StreamingKernelContent> streamingResponse;

            try
            {
                streamingResponse = this._kernel.InvokePromptStreamingAsync(prompt);
            }
            catch (Exception ex)
            {
                this._logger.LogError(ex, "Error initializing streaming AI response for prompt: {Prompt}", prompt);
                yield break;
            }

            IAsyncEnumerator<StreamingKernelContent> enumerator = streamingResponse.GetAsyncEnumerator();

            try
            {
                while (await enumerator.MoveNextAsync())
                {
                    StreamingKernelContent content = enumerator.Current;
                    string? contentString = content?.ToString();

                    if (!string.IsNullOrEmpty(contentString))
                    {
                        yield return contentString;
                    }
                }
            }
            finally
            {
                await enumerator.DisposeAsync();
            }
        }
    }
}