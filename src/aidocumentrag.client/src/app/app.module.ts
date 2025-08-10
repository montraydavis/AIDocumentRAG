import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DocumentsQuickViewComponent } from './components/documents-quick-view/documents-quick-view.component';
import { ChatViewComponent } from './components/chat-view/chat-view.component';
import { LoadingDialogComponent } from './components/loading-dialog/loading-dialog.component';
import { NoteGenerationComponent } from './components/note-generation/note-generation.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { FileUploadModalComponent } from './components/file-upload-modal/file-upload-modal.component';
import { FileManagementService } from './services/file-management.service';
import { AIChatService } from './services/ai-chat.service';
import { DocumentSearchService } from './services/document-search.service';
import { NoteGenerationService } from './services/note-generation.service';

@NgModule({
  declarations: [
    AppComponent,
    DocumentsQuickViewComponent,
    ChatViewComponent,
    LoadingDialogComponent,
    FileUploadComponent,
    NoteGenerationComponent,
    FileUploadModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    provideHttpClient(),
    FileManagementService,
    AIChatService,
    DocumentSearchService,
    NoteGenerationService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
