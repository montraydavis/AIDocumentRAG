import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DocumentsQuickViewComponent } from './components/documents-quick-view/documents-quick-view.component';
import { ChatViewComponent } from './components/chat-view/chat-view.component';
import { LoadingDialogComponent } from './components/loading-dialog/loading-dialog.component';
import { FileManagementService } from './services/file-management.service';
import { AIChatService } from './services/ai-chat.service';
import { DocumentSearchService } from './services/document-search.service';

@NgModule({
  declarations: [
    AppComponent,
    DocumentsQuickViewComponent,
    ChatViewComponent,
    LoadingDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideHttpClient(),
    FileManagementService,
    AIChatService,
    DocumentSearchService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
