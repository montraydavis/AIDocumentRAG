namespace AIDocumentRAG.Server.Core.NoteGeneration
{
    using AIDocumentRAG.Server.Models.NoteGeneration;

    public interface INoteGenerationService
    {
        Task<NoteGenerationResponse> GenerateNoteAsync(GenerateNoteRequest request);
        Task<NoteGenerationResponse> GenerateMultiDocumentNoteAsync(GenerateNoteRequest request);
        Task<IEnumerable<NoteDto>> GetAllNotesAsync();
        Task<NoteDto?> GetNoteByIdAsync(string noteId);
        Task<IEnumerable<NoteDto>> GetNotesForDocumentAsync(string fileName);
        Task<IEnumerable<NoteDto>> GetNotesForMultipleDocumentsAsync(List<string> documentNames);
        Task<IEnumerable<NoteDto>> GetCrossDocumentNotesAsync(List<string> documentNames);
        Task<bool> DeleteNoteAsync(string noteId);
        Task<bool> DeleteNotesForDocumentAsync(string fileName);
        Task<bool> UpdateNoteAsync(string noteId, NoteDto note);
        Task<IEnumerable<NoteDto>> SearchNotesAsync(string searchTerm);
    }
}