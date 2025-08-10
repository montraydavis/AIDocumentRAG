import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NoteGenerationService, NoteDto, GenerateNoteRequest, NoteGenerationResponse } from '../../services/note-generation.service';

@Component({
  selector: 'app-note-generation',
  templateUrl: './note-generation.component.html',
  styleUrls: ['./note-generation.component.css'],
  standalone: false
})
export class NoteGenerationComponent implements OnInit, OnDestroy {
  @Input() documentNames: string[] = [];
  @Input() documentTitles: string[] = [];

  noteForm: FormGroup;
  isGenerating = false;
  notes: NoteDto[] = [];
  isLoadingNotes = false;
  searchTerm = '';
  showCustomInstructions = false;
  isMultiDocumentMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private noteGenerationService: NoteGenerationService
  ) {
    this.noteForm = this.fb.group({
      instructions: [''],
      category: ['General'],
      tags: [''],
      crossDocumentInstructions: ['']
    });
  }

  ngOnInit(): void {
    this.updateMultiDocumentMode();
    if (this.documentNames.length > 0) {
      this.loadNotesForDocuments();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMultiDocumentMode(): void {
    this.isMultiDocumentMode = this.documentNames.length > 1;
    if (this.isMultiDocumentMode) {
      this.noteForm.get('crossDocumentInstructions')?.enable();
    } else {
      this.noteForm.get('crossDocumentInstructions')?.disable();
    }
  }

  loadNotesForDocuments(): void {
    if (this.documentNames.length === 0) return;

    this.isLoadingNotes = true;
    
    if (this.isMultiDocumentMode) {
      this.noteGenerationService.getNotesForMultipleDocuments(this.documentNames)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notes) => {
            this.notes = notes;
            this.isLoadingNotes = false;
          },
          error: (error) => {
            console.error('Error loading notes:', error);
            this.isLoadingNotes = false;
          }
        });
    } else {
      this.noteGenerationService.getNotesForDocument(this.documentNames[0])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notes) => {
            this.notes = notes;
            this.isLoadingNotes = false;
          },
          error: (error) => {
            console.error('Error loading notes:', error);
            this.isLoadingNotes = false;
          }
        });
    }
  }

  generateNote(): void {
    if (this.documentNames.length === 0 || this.isGenerating) return;

    const formValue = this.noteForm.value;
    const request: GenerateNoteRequest = {
      documentNames: this.documentNames,
      instructions: formValue.instructions || undefined,
      category: formValue.category || 'General',
      tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      noteType: this.isMultiDocumentMode ? 'MultiDocument' : 'SingleDocument',
      crossDocumentInstructions: this.isMultiDocumentMode ? formValue.crossDocumentInstructions || undefined : undefined
    };

    this.isGenerating = true;
    
    const serviceCall = this.isMultiDocumentMode ? 
      this.noteGenerationService.generateMultiDocumentNote(request) :
      this.noteGenerationService.generateNote(request);

    serviceCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NoteGenerationResponse) => {
          if (response.success && response.note) {
            this.notes.unshift(response.note);
            this.noteForm.reset({
              instructions: '',
              category: 'General',
              tags: '',
              crossDocumentInstructions: ''
            });
            this.showCustomInstructions = false;
          } else {
            console.error('Note generation failed:', response.error);
            // You could add a toast notification here
          }
          this.isGenerating = false;
        },
        error: (error) => {
          console.error('Error generating note:', error);
          this.isGenerating = false;
        }
      });
  }

  deleteNote(noteId: string): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.noteGenerationService.deleteNote(noteId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              this.notes = this.notes.filter(note => note.id !== noteId);
            }
          },
          error: (error) => {
            console.error('Error deleting note:', error);
          }
        });
    }
  }

  editNote(note: NoteDto): void {
    // For now, we'll just log the edit - you could implement inline editing
    console.log('Edit note:', note);
  }

  updateNote(note: NoteDto): void {
    // For now, we'll just log the update - you could implement inline editing
    console.log('Update note:', note);
  }

  searchNotes(): void {
    if (!this.searchTerm.trim()) {
      this.loadNotesForDocuments();
      return;
    }

    this.isLoadingNotes = true;
    this.noteGenerationService.searchNotes(this.searchTerm)
      .pipe(takeUntil(this.destroy$))
              .subscribe({
          next: (notes) => {
            this.notes = notes.filter(note => note.linkedDocuments.includes(this.documentNames[0])); // Filter notes that include the first document
            this.isLoadingNotes = false;
          },
        error: (error) => {
          console.error('Error searching notes:', error);
          this.isLoadingNotes = false;
        }
      });
  }

  toggleCustomInstructions(): void {
    this.showCustomInstructions = !this.showCustomInstructions;
  }

  formatNoteContent(content: string): string {
    return content.replace(/\n/g, '<br>');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getTagClass(tag: string): string {
    const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `badge bg-${colors[Math.abs(hash) % colors.length]}`;
  }

  getDocumentDisplayName(): string {
    if (this.documentNames.length === 0) return 'No documents selected';
    if (this.documentNames.length === 1) return this.documentNames[0];
    return `${this.documentNames.length} documents selected`;
  }

  getNoteTypeLabel(note: NoteDto): string {
    return note.noteType === 'MultiDocument' ? 'Multi-Document' : 'Single Document';
  }

  getLinkedDocumentsDisplay(note: NoteDto): string {
    if (note.linkedDocuments.length === 0) return 'No documents linked';
    if (note.linkedDocuments.length === 1) return note.linkedDocuments[0];
    return note.linkedDocuments.join(', ');
  }
} 