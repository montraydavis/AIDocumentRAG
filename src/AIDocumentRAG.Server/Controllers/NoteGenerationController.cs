namespace AIDocumentRAG.Server.Controllers
{
    using AIDocumentRAG.Server.Core.NoteGeneration;
    using AIDocumentRAG.Server.Models.NoteGeneration;

    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class NoteGenerationController : ControllerBase
    {
        private readonly INoteGenerationService _noteGenerationService;

        public NoteGenerationController(INoteGenerationService noteGenerationService)
        {
            _noteGenerationService = noteGenerationService;
        }

        [HttpPost("generate")]
        public async Task<ActionResult<NoteGenerationResponse>> GenerateNote([FromBody] GenerateNoteRequest request)
        {
            try
            {
                NoteGenerationResponse response = await _noteGenerationService.GenerateNoteAsync(request);
                return response.Success ? (ActionResult<NoteGenerationResponse>)Ok(response) : (ActionResult<NoteGenerationResponse>)BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new NoteGenerationResponse
                {
                    Success = false,
                    Message = "Error generating note",
                    Error = ex.Message
                });
            }
        }

        [HttpPost("generate-multi")]
        public async Task<ActionResult<NoteGenerationResponse>> GenerateMultiDocumentNote([FromBody] GenerateNoteRequest request)
        {
            try
            {
                NoteGenerationResponse response = await _noteGenerationService.GenerateMultiDocumentNoteAsync(request);
                return response.Success ? (ActionResult<NoteGenerationResponse>)Ok(response) : (ActionResult<NoteGenerationResponse>)BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new NoteGenerationResponse
                {
                    Success = false,
                    Message = "Error generating multi-document note",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetAllNotes()
        {
            try
            {
                IEnumerable<NoteDto> notes = await _noteGenerationService.GetAllNotesAsync();
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{noteId}")]
        public async Task<ActionResult<NoteDto>> GetNoteById(string noteId)
        {
            try
            {
                NoteDto? note = await _noteGenerationService.GetNoteByIdAsync(noteId);
                return note == null ? (ActionResult<NoteDto>)NotFound() : (ActionResult<NoteDto>)Ok(note);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("document/{fileName}")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotesForDocument(string fileName)
        {
            try
            {
                IEnumerable<NoteDto> notes = await _noteGenerationService.GetNotesForDocumentAsync(fileName);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("documents/multiple")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotesForMultipleDocuments([FromQuery] List<string> documentNames)
        {
            try
            {
                if (documentNames == null || !documentNames.Any())
                {
                    return BadRequest("Document names are required");
                }

                IEnumerable<NoteDto> notes = await _noteGenerationService.GetNotesForMultipleDocumentsAsync(documentNames);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("cross-document/{documentNames}")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetCrossDocumentNotes(string documentNames)
        {
            try
            {
                List<string> names = documentNames.Split(',').Select(n => n.Trim()).ToList();
                if (!names.Any())
                {
                    return BadRequest("Document names are required");
                }

                IEnumerable<NoteDto> notes = await _noteGenerationService.GetCrossDocumentNotesAsync(names);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{noteId}")]
        public async Task<ActionResult> DeleteNote(string noteId)
        {
            try
            {
                bool success = await _noteGenerationService.DeleteNoteAsync(noteId);
                return success ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("document/{fileName}")]
        public async Task<ActionResult> DeleteNotesForDocument(string fileName)
        {
            try
            {
                bool success = await _noteGenerationService.DeleteNotesForDocumentAsync(fileName);
                return success ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{noteId}")]
        public async Task<ActionResult<NoteDto>> UpdateNote(string noteId, [FromBody] NoteDto note)
        {
            try
            {
                bool success = await _noteGenerationService.UpdateNoteAsync(noteId, note);
                if (success)
                {
                    NoteDto? updatedNote = await _noteGenerationService.GetNoteByIdAsync(noteId);
                    return Ok(updatedNote);
                }

                return NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> SearchNotes([FromQuery] string q)
        {
            try
            {
                IEnumerable<NoteDto> notes = await _noteGenerationService.SearchNotesAsync(q);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}