namespace AIDocumentRAG.Server.Services.NoteGeneration
{
    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Core.NoteGeneration;
    using AIDocumentRAG.Server.Models.NoteGeneration;

    using OllamaSharp;

    using System.Text;

    public class NoteGenerationService : INoteGenerationService
    {
        private readonly INoteRepository _noteRepository;
        private readonly IDocumentSummaryService _documentSummaryService;
        private readonly OllamaApiClient _ollamaClient;

        private const string DEFAULT_NOTE_INSTRUCTIONS = "Generate a comprehensive note summarizing the key points, insights, and important information from this document. Focus on actionable insights and main takeaways.";

        public NoteGenerationService(INoteRepository noteRepository, IDocumentSummaryService documentSummaryService)
        {
            _noteRepository = noteRepository;
            _documentSummaryService = documentSummaryService;
            _ollamaClient = new OllamaApiClient(new HttpClient { BaseAddress = new Uri("http://localhost:11434") });
        }

        public async Task<NoteGenerationResponse> GenerateNoteAsync(GenerateNoteRequest request)
        {
            try
            {
                if (request.DocumentNames == null || !request.DocumentNames.Any())
                {
                    return new NoteGenerationResponse
                    {
                        Success = false,
                        Message = "No documents specified for note generation"
                    };
                }

                // Determine note type based on document count
                NoteType noteType = request.DocumentNames.Count > 1 ? NoteType.MultiDocument : NoteType.SingleDocument;

                // Get document summaries for context
                List<string> documentSummaries = new List<string>();
                foreach (string documentName in request.DocumentNames)
                {
                    Models.Responses.DocumentSummaryDto? summary = await _documentSummaryService.GetSummaryAsync(documentName);
                    if (summary != null)
                    {
                        documentSummaries.Add($"Document: {documentName}\nSummary: {summary.Summary}");
                    }
                }

                if (!documentSummaries.Any())
                {
                    return new NoteGenerationResponse
                    {
                        Success = false,
                        Message = "Could not retrieve document summaries for note generation"
                    };
                }

                // Build AI prompt
                string prompt = BuildNoteGenerationPrompt(request, documentSummaries, noteType);

                // Generate note using Ollama
                string generatedContent = GenerateNoteContent(prompt);

                // Parse and create note
                NoteDto note = new NoteDto
                {
                    LinkedDocuments = request.DocumentNames,
                    Title = ExtractTitleFromContent(generatedContent),
                    Content = generatedContent,
                    Category = request.Category ?? "General",
                    Tags = request.Tags ?? new List<string>(),
                    GeneratedBy = "Ollama AI",
                    Instructions = request.Instructions ?? DEFAULT_NOTE_INSTRUCTIONS,
                    NoteType = noteType,
                    CrossDocumentContext = noteType == NoteType.MultiDocument ?
                        ExtractCrossDocumentContext(generatedContent, request.DocumentNames) : null
                };

                // Save note
                NoteDto savedNote = await _noteRepository.SaveNoteAsync(note);

                return new NoteGenerationResponse
                {
                    Success = true,
                    Message = "Note generated successfully",
                    Note = savedNote
                };
            }
            catch (Exception ex)
            {
                return new NoteGenerationResponse
                {
                    Success = false,
                    Message = "Error generating note",
                    Error = ex.Message
                };
            }
        }

        public async Task<NoteGenerationResponse> GenerateMultiDocumentNoteAsync(GenerateNoteRequest request)
        {
            // For multi-document notes, we'll use the same logic but ensure it's marked as multi-document
            request.NoteType = NoteType.MultiDocument;
            return await GenerateNoteAsync(request);
        }

        public async Task<IEnumerable<NoteDto>> GetAllNotesAsync()
        {
            return await _noteRepository.GetAllNotesAsync();
        }

        public async Task<NoteDto?> GetNoteByIdAsync(string noteId)
        {
            return await _noteRepository.GetNoteByIdAsync(noteId);
        }

        public async Task<IEnumerable<NoteDto>> GetNotesForDocumentAsync(string fileName)
        {
            return await _noteRepository.GetNotesForDocumentAsync(fileName);
        }

        public async Task<IEnumerable<NoteDto>> GetNotesForMultipleDocumentsAsync(List<string> documentNames)
        {
            return await _noteRepository.GetNotesForMultipleDocumentsAsync(documentNames);
        }

        public async Task<IEnumerable<NoteDto>> GetCrossDocumentNotesAsync(List<string> documentNames)
        {
            return await _noteRepository.GetCrossDocumentNotesAsync(documentNames);
        }

        public async Task<bool> DeleteNoteAsync(string noteId)
        {
            return await _noteRepository.DeleteNoteAsync(noteId);
        }

        public async Task<bool> DeleteNotesForDocumentAsync(string fileName)
        {
            return await _noteRepository.DeleteNotesForDocumentAsync(fileName);
        }

        public async Task<bool> UpdateNoteAsync(string noteId, NoteDto note)
        {
            return await _noteRepository.UpdateNoteAsync(noteId, note);
        }

        public async Task<IEnumerable<NoteDto>> SearchNotesAsync(string searchTerm)
        {
            return await _noteRepository.SearchNotesAsync(searchTerm);
        }

        private string BuildNoteGenerationPrompt(GenerateNoteRequest request, List<string> documentSummaries, NoteType noteType)
        {
            string instructions = request.Instructions ?? DEFAULT_NOTE_INSTRUCTIONS;
            string crossDocumentInstructions = request.CrossDocumentInstructions ??
                "Analyze the relationships and connections between these documents. Identify common themes, contradictions, and insights that emerge from comparing them.";

            StringBuilder prompt = new StringBuilder();
            prompt.AppendLine("You are an expert document analyst. Generate a comprehensive note based on the following documents and instructions.");
            prompt.AppendLine();

            if (noteType == NoteType.MultiDocument)
            {
                prompt.AppendLine("MULTI-DOCUMENT ANALYSIS REQUEST:");
                prompt.AppendLine($"Number of documents: {request.DocumentNames.Count}");
                prompt.AppendLine($"Documents: {string.Join(", ", request.DocumentNames)}");
                prompt.AppendLine();
                prompt.AppendLine("Instructions for cross-document analysis:");
                prompt.AppendLine(crossDocumentInstructions);
                prompt.AppendLine();
                prompt.AppendLine("Please generate a note that:");
                prompt.AppendLine("1. Identifies key themes across all documents");
                prompt.AppendLine("2. Highlights relationships and connections between documents");
                prompt.AppendLine("3. Provides comparative analysis where relevant");
                prompt.AppendLine("4. Summarizes insights that emerge from the combination of documents");
                prompt.AppendLine();
            }
            else
            {
                prompt.AppendLine("SINGLE DOCUMENT ANALYSIS REQUEST:");
                prompt.AppendLine($"Document: {request.DocumentNames.First()}");
                prompt.AppendLine();
                prompt.AppendLine("Instructions:");
                prompt.AppendLine(instructions);
                prompt.AppendLine();
            }

            prompt.AppendLine("DOCUMENT SUMMARIES:");
            prompt.AppendLine("==================");
            foreach (string summary in documentSummaries)
            {
                prompt.AppendLine(summary);
                prompt.AppendLine();
            }

            prompt.AppendLine("Please generate a well-structured note with:");
            prompt.AppendLine("- A clear, descriptive title");
            prompt.AppendLine("- Organized content with key points");
            prompt.AppendLine("- Actionable insights");
            prompt.AppendLine("- Relevant tags or categories");

            return prompt.ToString();
        }

        private string GenerateNoteContent(string prompt)
        {
            // For now, generate a basic note structure
            // TODO: Integrate with Ollama API properly
            string[] lines = prompt.Split('\n');
            int documentCount = lines.Count(l => l.StartsWith("Document:"));

            return documentCount > 1
                ? @"# Multi-Document Analysis Note

## Key Themes
- Common themes identified across documents
- Shared concepts and ideas

## Document Relationships
- How documents relate to each other
- Connections and dependencies

## Comparative Analysis
- Similarities and differences
- Contradictions or complementary information

## Cross-Document Insights
- Insights that emerge from combining documents
- New perspectives gained

## Action Items
- Key takeaways
- Next steps based on analysis"
                : @"# Document Summary Note

## Key Points
- Main topics and concepts
- Important information

## Insights
- Key findings and observations
- Notable details

## Summary
- Overall document content
- Main takeaways

## Tags
- Relevant categories
- Key themes";
        }

        private string ExtractTitleFromContent(string content)
        {
            // Extract first line or first sentence as title
            string[] lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            string? firstLine = lines.FirstOrDefault()?.Trim();

            if (string.IsNullOrEmpty(firstLine))
            {
                return "Generated Note";
            }

            // If first line is too long, truncate it
            if (firstLine.Length > 100)
            {
                firstLine = firstLine.Substring(0, 97) + "...";
            }

            return firstLine;
        }

        private string? ExtractCrossDocumentContext(string content, List<string> documentNames)
        {
            if (documentNames.Count <= 1)
            {
                return null;
            }

            // Extract the cross-document analysis section if it exists
            string[] lines = content.Split('\n');
            List<string> contextLines = new List<string>();
            bool inContextSection = false;

            foreach (string line in lines)
            {
                if (line.Contains("cross-document", StringComparison.OrdinalIgnoreCase) ||
                    line.Contains("relationships", StringComparison.OrdinalIgnoreCase) ||
                    line.Contains("comparative", StringComparison.OrdinalIgnoreCase))
                {
                    inContextSection = true;
                }

                if (inContextSection)
                {
                    contextLines.Add(line);
                }

                // Stop if we hit another major section
                if (inContextSection && (line.StartsWith("#") || line.StartsWith("##")))
                {
                    break;
                }
            }

            return contextLines.Any() ? string.Join("\n", contextLines) : null;
        }
    }
}