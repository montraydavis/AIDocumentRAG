import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentsQuickViewComponent } from './components/documents-quick-view/documents-quick-view.component';
import { ChatViewComponent } from './components/chat-view/chat-view.component';
import { NoteGenerationComponent } from './components/note-generation/note-generation.component';

const routes: Routes = [
  { path: '', redirectTo: '/documents', pathMatch: 'full' },
  { path: 'documents', component: DocumentsQuickViewComponent },
  { path: 'chat', component: ChatViewComponent },
  { path: 'notes', component: NoteGenerationComponent },
  { path: '**', redirectTo: '/documents' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
