namespace AIDocumentRAG.Server.Core.ChatInference
{
    public interface IAIChatService
    {
        Task<string> GenerateResponseAsync(string prompt, string servicer, string model);
        IAsyncEnumerable<string> GenerateResponseStreamAsync(string prompt, string servicer, string model);
    }
}