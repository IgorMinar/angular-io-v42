import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { NgioDocviewerComponent } from './ngio-docviewer/ngio-docviewer.component';
import { NgioSidenavComponent } from './ngio-sidenav/ngio-sidenav.component';
import { NgioCodeExampleComponent } from './ngio-code-example/ngio-code-example.component';

@NgModule({
  declarations: [
    AppComponent,
    NgioDocviewerComponent,
    NgioSidenavComponent,
    NgioCodeExampleComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [
      // TODO(i): it's kind of odd that the BrowserModule doesn't provide Location by default => fix?
      Location,
      { provide: LocationStrategy,  useClass: PathLocationStrategy }
  ],
  bootstrap: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule { }
