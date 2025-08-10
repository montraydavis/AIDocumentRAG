namespace AIDocumentRAG.Server.Models.NoteGeneration
{
    public class GenerateNoteRequest
    {
        public List<string> DocumentNames { get; set; } = new List<string>();
        public string? Instructions { get; set; }
        public string? Category { get; set; }
        public List<string>? Tags { get; set; }
        public NoteType NoteType { get; set; } = NoteType.SingleDocument;
        public string? CrossDocumentInstructions { get; set; }
    }
}