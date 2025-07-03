namespace AIDocumentRAG.Server.Models
{
    public record FileMetadata(
        string OriginalPath,
        string CopiedPath,
        string FileName,
        DateTime CreationDate,
        DateTime ModifiedDate,
        long FileSize,
        int CharacterCount,
        string FileExtension);
}
