
namespace AIDocumentRAG.Server.Models.Requests
{
    public record AIChatRequest(string Prompt, string Servicer, string Model);
}