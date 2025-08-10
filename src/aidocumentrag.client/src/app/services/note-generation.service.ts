import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NoteDto {
  id: string;
  linkedDocuments: string[];
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  generatedBy: string;
  instructions: string;
  noteType: 'SingleDocument' | 'MultiDocument';
  crossDocumentContext?: string;
}

export interface MultiDocumentNoteDto extends NoteDto {
  documentReferences: DocumentReference[];
  crossDocumentSummary: string;
  documentRelationships: string[];
  comparativeAnalysis?: string;
}

export interface DocumentReference {
  fileName: string;
  documentTitle: string;
  relevance: string;
  keyPoints: string[];
}

export interface GenerateNoteRequest {
  documentNames: string[];
  instructions?: string;
  category?: string;
  tags?: string[];
  noteType: 'SingleDocument' | 'MultiDocument';
  crossDocumentInstructions?: string;
}

export interface NoteGenerationResponse {
  success: boolean;
  message: string;
  note?: NoteDto;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoteGenerationService {
  private readonly baseUrl = `${environment.apiUrl}/api/notegeneration`;

  constructor(private http: HttpClient) { }

  generateNote(request: GenerateNoteRequest): Observable<NoteGenerationResponse> {
    return this.http.post<NoteGenerationResponse>(`${this.baseUrl}/generate`, request).pipe(
      catchError(error => {
        console.error('Error generating note:', error);
        return of({
          success: false,
          message: 'Failed to generate note',
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  generateMultiDocumentNote(request: GenerateNoteRequest): Observable<NoteGenerationResponse> {
    return this.http.post<NoteGenerationResponse>(`${this.baseUrl}/generate-multi`, request).pipe(
      catchError(error => {
        console.error('Error generating multi-document note:', error);
        return of({
          success: false,
          message: 'Failed to generate multi-document note',
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  getNotesForDocument(fileName: string): Observable<NoteDto[]> {
    return this.http.get<NoteDto[]>(`${this.baseUrl}/document/${encodeURIComponent(fileName)}`).pipe(
      catchError(error => {
        console.error('Error fetching notes for document:', error);
        return of([]);
      })
    );
  }

  getNotesForMultipleDocuments(documentNames: string[]): Observable<NoteDto[]> {
    const queryParams = documentNames.map(name => `documentNames=${encodeURIComponent(name)}`).join('&');
    return this.http.get<NoteDto[]>(`${this.baseUrl}/documents/multiple?${queryParams}`).pipe(
      catchError(error => {
        console.error('Error fetching notes for multiple documents:', error);
        return of([]);
      })
    );
  }

  getCrossDocumentNotes(documentNames: string[]): Observable<NoteDto[]> {
    const encodedNames = documentNames.map(name => encodeURIComponent(name)).join(',');
    return this.http.get<NoteDto[]>(`${this.baseUrl}/cross-document/${encodedNames}`).pipe(
      catchError(error => {
        console.error('Error fetching cross-document notes:', error);
        return of([]);
      })
    );
  }

  getAllNotes(): Observable<NoteDto[]> {
    return this.http.get<NoteDto[]>(`${this.baseUrl}/all`).pipe(
      catchError(error => {
        console.error('Error fetching all notes:', error);
        return of([]);
      })
    );
  }

  getNoteById(noteId: string): Observable<NoteDto | null> {
    return this.http.get<NoteDto>(`${this.baseUrl}/${noteId}`).pipe(
      catchError(error => {
        console.error('Error fetching note by ID:', error);
        return of(null);
      })
    );
  }

  deleteNote(noteId: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${noteId}`).pipe(
      map(() => true),
      catchError((error: Error) => {
        console.error('Error deleting note:', error);
        return of(false);
      })
    );
  }

  updateNote(noteId: string, note: NoteDto): Observable<NoteDto | null> {
    return this.http.put<NoteDto>(`${this.baseUrl}/${noteId}`, note).pipe(
      catchError(error => {
        console.error('Error updating note:', error);
        return of(null);
      })
    );
  }

  searchNotes(searchTerm: string): Observable<NoteDto[]> {
    if (!searchTerm.trim()) {
      return this.getAllNotes();
    }
    
    return this.http.get<NoteDto[]>(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`).pipe(
      catchError(error => {
        console.error('Error searching notes:', error);
        return of([]);
      })
    );
  }
} 