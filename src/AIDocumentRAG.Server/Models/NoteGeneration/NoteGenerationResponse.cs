namespace AIDocumentRAG.Server.Models.NoteGeneration
{
    public class NoteGenerationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public NoteDto? Note { get; set; }
        public string? Error { get; set; }
    }
} 