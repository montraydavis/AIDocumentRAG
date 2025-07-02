
namespace AIDocumentRAG.Server.Models.Responses
{
    public record FileMetadataDto(
        string OriginalPath,
        string CopiedPath,
        string FileName,
        DateTime CreationDate,
        DateTime ModifiedDate,
        long FileSize,
        int CharacterCount,
        string FileExtension);
}
