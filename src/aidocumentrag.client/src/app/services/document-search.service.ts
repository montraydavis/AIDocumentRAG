import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { FileMetadataDto } from './file-management.service';

export interface SearchState {
  query: string;
  isActive: boolean;
  filteredFiles: FileMetadataDto[];
  totalResults: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentSearchService {
  private searchQuery$ = new BehaviorSubject<string>('');
  private allFiles$ = new BehaviorSubject<FileMetadataDto[]>([]);
  
  // Public observables
  public readonly searchState$: Observable<SearchState>;

  constructor() {
    this.searchState$ = combineLatest([
      this.searchQuery$,
      this.allFiles$
    ]).pipe(
      map(([query, files]) => {
        const trimmedQuery = query.trim().toLowerCase();
        const isActive = trimmedQuery.length > 0;
        
        let filteredFiles = files;
        
        if (isActive) {
          filteredFiles = files.filter(file => 
            this.matchesSearchQuery(file, trimmedQuery)
          );
        }

        return {
          query: trimmedQuery,
          isActive,
          filteredFiles,
          totalResults: filteredFiles.length
        };
      })
    );
  }

  // Update the search query
  setSearchQuery(query: string): void {
    this.searchQuery$.next(query);
  }

  // Update the files list (called when documents are loaded/refreshed)
  setFiles(files: FileMetadataDto[]): void {
    this.allFiles$.next(files);
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery$.next('');
  }

  // Get current search query
  getCurrentQuery(): string {
    return this.searchQuery$.value;
  }

  // Get current search state
  getCurrentState(): SearchState {
    const query = this.searchQuery$.value.trim().toLowerCase();
    const files = this.allFiles$.value;
    const isActive = query.length > 0;
    
    let filteredFiles = files;
    if (isActive) {
      filteredFiles = files.filter(file => 
        this.matchesSearchQuery(file, query)
      );
    }

    return {
      query,
      isActive,
      filteredFiles,
      totalResults: filteredFiles.length
    };
  }

  private matchesSearchQuery(file: FileMetadataDto, query: string): boolean {
    // Search in file name (most important)
    if (file.fileName.toLowerCase().includes(query)) {
      return true;
    }

    // Search in file extension
    if (file.fileExtension.toLowerCase().includes(query)) {
      return true;
    }

    // Search by file type keywords
    const fileTypeKeywords = this.getFileTypeKeywords(file.fileExtension);
    if (fileTypeKeywords.some(keyword => keyword.includes(query))) {
      return true;
    }

    // Search by file size ranges
    if (this.matchesFileSizeQuery(file.fileSize, query)) {
      return true;
    }

    // Search by date (basic - could be enhanced)
    if (this.matchesDateQuery(file.creationDate, file.modifiedDate, query)) {
      return true;
    }

    return false;
  }

  private getFileTypeKeywords(extension: string): string[] {
    const ext = extension.toLowerCase();
    const keywords: string[] = [ext];

    switch (ext) {
      case '.pdf':
        keywords.push('pdf', 'document', 'portable');
        break;
      case '.docx':
      case '.doc':
        keywords.push('word', 'document', 'text', 'office');
        break;
      case '.xlsx':
      case '.xls':
        keywords.push('excel', 'spreadsheet', 'data', 'office');
        break;
      case '.txt':
        keywords.push('text', 'plain', 'note');
        break;
      case '.pptx':
      case '.ppt':
        keywords.push('powerpoint', 'presentation', 'slides', 'office');
        break;
      default:
        keywords.push('file');
    }

    return keywords;
  }

  private matchesFileSizeQuery(fileSize: number, query: string): boolean {
    // Convert file size to human readable and check
    const sizeInKB = fileSize / 1024;
    const sizeInMB = sizeInKB / 1024;
    const sizeInGB = sizeInMB / 1024;

    // Check for size-related queries
    if (query.includes('kb') || query.includes('kilobyte')) {
      return true;
    }
    if (query.includes('mb') || query.includes('megabyte')) {
      return sizeInMB >= 1;
    }
    if (query.includes('gb') || query.includes('gigabyte')) {
      return sizeInGB >= 1;
    }
    if (query.includes('large') && sizeInMB > 10) {
      return true;
    }
    if (query.includes('small') && sizeInKB < 100) {
      return true;
    }

    return false;
  }

  private matchesDateQuery(creationDate: string, modifiedDate: string, query: string): boolean {
    const today = new Date();
    const creation = new Date(creationDate);
    const modified = new Date(modifiedDate);

    // Basic date matching - could be enhanced with more sophisticated parsing
    if (query.includes('today')) {
      return this.isSameDay(creation, today) || this.isSameDay(modified, today);
    }
    if (query.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return this.isSameDay(creation, yesterday) || this.isSameDay(modified, yesterday);
    }
    if (query.includes('recent') || query.includes('new')) {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return creation > weekAgo || modified > weekAgo;
    }

    // Check if query contains year
    const currentYear = today.getFullYear().toString();
    const lastYear = (today.getFullYear() - 1).toString();
    
    if (query.includes(currentYear)) {
      return creation.getFullYear().toString() === currentYear || 
             modified.getFullYear().toString() === currentYear;
    }
    if (query.includes(lastYear)) {
      return creation.getFullYear().toString() === lastYear || 
             modified.getFullYear().toString() === lastYear;
    }

    return false;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
}
