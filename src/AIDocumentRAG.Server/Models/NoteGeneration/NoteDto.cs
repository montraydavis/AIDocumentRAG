namespace AIDocumentRAG.Server.Models.NoteGeneration
{
    public enum NoteType
    {
        SingleDocument,
        MultiDocument
    }

    public class NoteDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public List<string> LinkedDocuments { get; set; } = new List<string>();
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public string GeneratedBy { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
        public NoteType NoteType { get; set; } = NoteType.SingleDocument;
        public string? CrossDocumentContext { get; set; }
    }
} 