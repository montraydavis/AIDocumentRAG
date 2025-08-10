namespace AIDocumentRAG.Server.Models.NoteGeneration
{
    public class MultiDocumentNoteDto : NoteDto
    {
        public List<DocumentReference> DocumentReferences { get; set; } = new List<DocumentReference>();
        public string CrossDocumentSummary { get; set; } = string.Empty;
        public List<string> DocumentRelationships { get; set; } = new List<string>();
        public string? ComparativeAnalysis { get; set; }
    }

    public class DocumentReference
    {
        public string FileName { get; set; } = string.Empty;
        public string DocumentTitle { get; set; } = string.Empty;
        public string Relevance { get; set; } = string.Empty;
        public List<string> KeyPoints { get; set; } = new List<string>();
    }
} 