import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameContainerComponent } from './game-container/game-container.component';
import { GameCanvasComponent } from './game-canvas/game-canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    GameContainerComponent,
    GameCanvasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
