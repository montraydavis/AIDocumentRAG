import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface InitializeRequest {
  sourcePath: string;
  destinationPath?: string;
}

export interface InitializeResponse {
  success: boolean;
  fileCount: number;
  message: string;
  errors?: string[];
}

export interface FileMetadataDto {
  originalPath: string;
  copiedPath: string;
  fileName: string;
  creationDate: string;
  modifiedDate: string;
  fileSize: number;
  characterCount: number;
  fileExtension: string;
}

export interface FileContentResponse {
  fileName: string;
  content: string;
  metadata: FileMetadataDto;
}

export interface StatusResponse {
  isInitialized: boolean;
  fileCount: number;
  lastInitialized?: string;
  currentSourcePath?: string;
  currentDestinationPath?: string;
}

export interface RenameFileRequest {
  newFileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileManagementService {
  private readonly baseUrl = `${environment.apiUrl}/api/filemanagement`;

  constructor(private http: HttpClient) { }

  getStatus(): Observable<ApiResponse<StatusResponse>> {
    return this.http.get<ApiResponse<StatusResponse>>(`${this.baseUrl}/status`);
  }

  initialize(request: InitializeRequest): Observable<ApiResponse<InitializeResponse>> {
    return this.http.post<ApiResponse<InitializeResponse>>(`${this.baseUrl}/initialize`, request);
  }

  uploadFile(file: File): Observable<ApiResponse<FileMetadataDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<FileMetadataDto>>(`${this.baseUrl}/upload`, formData);
  }

  removeFile(fileName: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/files/${encodeURIComponent(fileName)}`);
  }

  renameFile(fileName: string, newFileName: string): Observable<ApiResponse<FileMetadataDto>> {
    const request: RenameFileRequest = { newFileName };
    return this.http.post<ApiResponse<FileMetadataDto>>(`${this.baseUrl}/files/${encodeURIComponent(fileName)}/rename`, request);
  }

  getAllFiles(): Observable<ApiResponse<FileMetadataDto[]>> {
    return this.http.get<ApiResponse<FileMetadataDto[]>>(`${this.baseUrl}/files`);
  }

  getFile(fileName: string): Observable<ApiResponse<FileMetadataDto>> {
    return this.http.get<ApiResponse<FileMetadataDto>>(`${this.baseUrl}/files/${encodeURIComponent(fileName)}`);
  }

  getFileContent(fileName: string): Observable<ApiResponse<FileContentResponse>> {
    return this.http.get<ApiResponse<FileContentResponse>>(`${this.baseUrl}/files/${encodeURIComponent(fileName)}/content`);
  }
}
