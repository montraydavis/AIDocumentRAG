# AIDocumentRAG

A full-stack document management and AI chat application that enables users to upload, manage, and chat with their documents using AI. Built with ASP.NET Core Web API backend and Angular frontend.

## Overview

AIDocumentRAG provides an intelligent document management system with AI-powered chat capabilities. Users can upload documents, organize them in a searchable interface, and engage in natural language conversations about document contents using OpenAI's GPT models.

![Screenshot_01](./Assets/01.png)

## Features

### Document Management

- **File Processing**: Automatic copying and metadata extraction from source directories
- **Multiple Format Support**: PDF, Word documents (.docx, .doc), Excel files (.xlsx, .xls), text files (.txt), and more
- **Metadata Tracking**: File size, creation date, modification date, character count, and file extension
- **Search Functionality**: Real-time search across file names, types, sizes, and dates
- **Multi-Select Mode**: Select and work with multiple documents simultaneously

### AI Chat Interface

- **Document-Aware Conversations**: Chat about specific documents or multiple documents at once
- **Conversation History**: Persistent chat history per document/document set
- **Streaming Responses**: Real-time AI response streaming for better user experience
- **Export Functionality**: Export chat conversations as JSON files

### User Interface

- **Fluent Design**: Modern UI following Microsoft Fluent Design principles
- **Responsive Layout**: Grid-based layout that adapts to different screen sizes
- **Real-time Updates**: Live document status and loading indicators
- **Search Integration**: Integrated search with filtering and result highlighting

## Architecture

### Backend (ASP.NET Core)

- **Controllers**:
  - `FileManagementController`: Handles document operations (initialize, list, retrieve)
  - `AIChatController`: Manages AI chat interactions (regular and streaming)
- **Services**:
  - `FileManagementService`: Core document processing and repository management
  - `AIChatService`: OpenAI integration with Semantic Kernel
- **Models**: Request/response DTOs with comprehensive API responses

### Frontend (Angular)

- **Components**:
  - `DocumentsQuickViewComponent`: Sidebar for document browsing and selection
  - `ChatViewComponent`: Main chat interface with conversation management
  - `LoadingDialogComponent`: System initialization and loading states
- **Services**:
  - `FileManagementService`: Backend API integration
  - `DocumentSearchService`: Client-side search functionality
  - `AIChatService`: AI chat API integration

## API Endpoints

### File Management

- `GET /api/filemanagement/status` - System status and initialization state
- `POST /api/filemanagement/initialize` - Initialize with source/destination paths
- `GET /api/filemanagement/files` - List all managed files
- `GET /api/filemanagement/files/{fileName}` - Get specific file metadata
- `GET /api/filemanagement/files/{fileName}/content` - Get file content

### AI Chat

- `POST /api/aichat/chat` - Send chat message (synchronous)
- `POST /api/aichat/chat/stream` - Send chat message (streaming response)

## Technology Stack

### Backend

- **Framework**: ASP.NET Core (.NET 9.0)
- **AI Integration**: Microsoft Semantic Kernel with OpenAI
- **Architecture**: Clean architecture with SOLID principles
- **Patterns**: Repository pattern, dependency injection, async/await

### Frontend

- **Framework**: Angular with TypeScript
- **UI Library**: Fluent UI Web Components
- **State Management**: RxJS observables and local storage
- **Styling**: CSS with Fluent Design variables and animations

### Development Tools

- **API Testing**: HTTP files for endpoint testing
- **Configuration**: Environment-based settings
- **CORS**: Configured for development origins

## Project Structure

```markdown
AIDocumentRAG/
├── AIDocumentRAG.Server/          # ASP.NET Core Web API
│   ├── Controllers/               # API controllers
│   ├── Services/                  # Business logic services
│   ├── Models/                    # DTOs and data models
│   └── Program.cs                 # Application entry point
├── aidocumentrag.client/          # Angular frontend
│   ├── src/app/components/        # UI components
│   ├── src/app/services/          # Angular services
│   └── src/environments/          # Environment configuration
└── Data/                          # Sample documentation files
```

## Configuration

### Backend Configuration

- **OpenAI API Key**: Set via `OPENAI_API_KEY` environment variable
- **File Management**: Configurable through `appsettings.json`
  - Default source/destination paths
  - Maximum file size limits
  - Allowed file extensions
- **CORS**: Development origins configured in `Program.cs`

### Frontend Configuration

- **API URL**: Configured in `environment.ts`
- **Proxy Configuration**: Set up for development API calls

## Key Components

### FileManagementService

Handles the core document processing workflow:

- Directory copying and file processing
- Metadata extraction and storage
- File repository management with in-memory storage

### AIChatService

Manages AI interactions:

- OpenAI GPT-4o-mini integration
- Streaming and non-streaming responses
- Error handling and logging

### Search System

Provides intelligent document discovery:

- Real-time filtering across multiple criteria
- File type keyword matching
- Size and date range queries

### Chat System

Enables document-focused conversations:

- Single and multi-document chat modes
- Conversation persistence per document set
- Export functionality for chat history
