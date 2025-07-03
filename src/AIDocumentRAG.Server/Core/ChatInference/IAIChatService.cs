namespace AIDocumentRAG.Server.Core.ChatInference
{
    public interface IAIChatService
    {
        Task<string> GenerateResponseAsync(string prompt);
        IAsyncEnumerable<string> GenerateResponseStreamAsync(string prompt);
    }
}