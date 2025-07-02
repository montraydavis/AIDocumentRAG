namespace AIDocumentRAG.Server.Models.Configuration
{
    public class FileManagementOptions
    {
        public const string SectionName = "FileManagement";

        public string DefaultSourcePath { get; set; } = string.Empty;
        public string DefaultDestinationPath { get; set; } = string.Empty;
        public long MaxFileSizeBytes { get; set; } = 52428800; // 50MB
        public IEnumerable<string> AllowedExtensions { get; set; } = Array.Empty<string>();
        public bool CreateDestinationIfNotExists { get; set; } = true;
        public bool OverwriteExistingFiles { get; set; } = true;
    }
}
