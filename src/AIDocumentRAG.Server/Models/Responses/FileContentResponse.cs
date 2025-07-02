

namespace AIDocumentRAG.Server.Models.Responses
{
    public record FileContentResponse(
        string FileName,
        string Content,
        FileMetadataDto Metadata);
}
