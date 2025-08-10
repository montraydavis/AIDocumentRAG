namespace AIDocumentRAG.Server.Services.NoteGeneration
{
    using AIDocumentRAG.Server.Core.NoteGeneration;
    using AIDocumentRAG.Server.Models.NoteGeneration;

    using System.Text.Json;

    public class NoteRepository : INoteRepository
    {
        private readonly string _notesDirectory;
        private readonly string _notesIndexPath;

        public NoteRepository()
        {
            _notesDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "Notes");
            _notesIndexPath = Path.Combine(_notesDirectory, "notes_index.json");
            EnsureNotesDirectoryExists();
        }

        public string GetNotesDirectoryPath() => _notesDirectory;

        private void EnsureNotesDirectoryExists()
        {
            if (!Directory.Exists(_notesDirectory))
            {
                Directory.CreateDirectory(_notesDirectory);
            }
        }

        public async Task<NoteDto> SaveNoteAsync(NoteDto note)
        {
            // Ensure note has an ID
            if (string.IsNullOrEmpty(note.Id))
            {
                note.Id = Guid.NewGuid().ToString();
            }

            // Set timestamps
            note.CreatedAt = DateTime.UtcNow;
            note.UpdatedAt = DateTime.UtcNow;

            // Save note to file
            string noteFilePath = Path.Combine(_notesDirectory, $"{note.Id}.json");
            string noteJson = JsonSerializer.Serialize(note, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(noteFilePath, noteJson);

            // Update index
            await UpdateNotesIndex(note);

            return note;
        }

        public async Task<NoteDto?> GetNoteByIdAsync(string noteId)
        {
            string noteFilePath = Path.Combine(_notesDirectory, $"{noteId}.json");
            if (!File.Exists(noteFilePath))
            {
                return null;
            }

            try
            {
                string noteJson = await File.ReadAllTextAsync(noteFilePath);
                return JsonSerializer.Deserialize<NoteDto>(noteJson);
            }
            catch
            {
                return null;
            }
        }

        public async Task<IEnumerable<NoteDto>> GetAllNotesAsync()
        {
            List<NoteDto> notes = new List<NoteDto>();
            List<NoteIndexInfo> index = await LoadNotesIndex();

            foreach (NoteIndexInfo noteInfo in index)
            {
                NoteDto? note = await GetNoteByIdAsync(noteInfo.Id);
                if (note != null)
                {
                    notes.Add(note);
                }
            }

            return notes.OrderByDescending(n => n.CreatedAt);
        }

        public async Task<IEnumerable<NoteDto>> GetNotesForDocumentAsync(string fileName)
        {
            IEnumerable<NoteDto> allNotes = await GetAllNotesAsync();
            return allNotes.Where(n => n.LinkedDocuments.Contains(fileName));
        }

        public async Task<IEnumerable<NoteDto>> GetNotesForMultipleDocumentsAsync(List<string> documentNames)
        {
            IEnumerable<NoteDto> allNotes = await GetAllNotesAsync();
            return allNotes.Where(n => n.LinkedDocuments.Any(doc => documentNames.Contains(doc)));
        }

        public async Task<IEnumerable<NoteDto>> GetCrossDocumentNotesAsync(List<string> documentNames)
        {
            IEnumerable<NoteDto> allNotes = await GetAllNotesAsync();
            return allNotes.Where(n =>
                n.NoteType == NoteType.MultiDocument &&
                n.LinkedDocuments.Count > 1 &&
                n.LinkedDocuments.All(doc => documentNames.Contains(doc)));
        }

        public async Task<bool> DeleteNoteAsync(string noteId)
        {
            try
            {
                string noteFilePath = Path.Combine(_notesDirectory, $"{noteId}.json");
                if (File.Exists(noteFilePath))
                {
                    File.Delete(noteFilePath);
                }

                await RemoveFromNotesIndex(noteId);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteNotesForDocumentAsync(string fileName)
        {
            try
            {
                IEnumerable<NoteDto> notesToDelete = await GetNotesForDocumentAsync(fileName);
                foreach (NoteDto note in notesToDelete)
                {
                    await DeleteNoteAsync(note.Id);
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateNoteAsync(string noteId, NoteDto note)
        {
            try
            {
                note.UpdatedAt = DateTime.UtcNow;
                await SaveNoteAsync(note);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<IEnumerable<NoteDto>> SearchNotesAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetAllNotesAsync();
            }

            IEnumerable<NoteDto> allNotes = await GetAllNotesAsync();
            string lowerSearchTerm = searchTerm.ToLowerInvariant();

            return allNotes.Where(note =>
                note.Title.ToLowerInvariant().Contains(lowerSearchTerm) ||
                note.Content.ToLowerInvariant().Contains(lowerSearchTerm) ||
                note.Category.ToLowerInvariant().Contains(lowerSearchTerm) ||
                note.Tags.Any(tag => tag.ToLowerInvariant().Contains(lowerSearchTerm)) ||
                note.LinkedDocuments.Any(doc => doc.ToLowerInvariant().Contains(lowerSearchTerm))
            );
        }

        private async Task<List<NoteIndexInfo>> LoadNotesIndex()
        {
            if (!File.Exists(_notesIndexPath))
            {
                return new List<NoteIndexInfo>();
            }

            try
            {
                string indexJson = await File.ReadAllTextAsync(_notesIndexPath);
                return JsonSerializer.Deserialize<List<NoteIndexInfo>>(indexJson) ?? new List<NoteIndexInfo>();
            }
            catch
            {
                return new List<NoteIndexInfo>();
            }
        }

        private async Task UpdateNotesIndex(NoteDto note)
        {
            List<NoteIndexInfo> index = await LoadNotesIndex();
            NoteIndexInfo? existingIndex = index.FirstOrDefault(i => i.Id == note.Id);

            if (existingIndex != null)
            {
                existingIndex.Title = note.Title;
                existingIndex.UpdatedAt = note.UpdatedAt ?? note.CreatedAt;
                existingIndex.LinkedDocuments = note.LinkedDocuments;
                existingIndex.NoteType = note.NoteType;
            }
            else
            {
                index.Add(new NoteIndexInfo
                {
                    Id = note.Id,
                    Title = note.Title,
                    CreatedAt = note.CreatedAt,
                    UpdatedAt = note.UpdatedAt ?? note.CreatedAt,
                    LinkedDocuments = note.LinkedDocuments,
                    NoteType = note.NoteType
                });
            }

            string indexJson = JsonSerializer.Serialize(index, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_notesIndexPath, indexJson);
        }

        private async Task RemoveFromNotesIndex(string noteId)
        {
            List<NoteIndexInfo> index = await LoadNotesIndex();
            index.RemoveAll(i => i.Id == noteId);
            string indexJson = JsonSerializer.Serialize(index, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_notesIndexPath, indexJson);
        }

        private class NoteIndexInfo
        {
            public string Id { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
            public List<string> LinkedDocuments { get; set; } = new List<string>();
            public NoteType NoteType { get; set; }
        }
    }
}