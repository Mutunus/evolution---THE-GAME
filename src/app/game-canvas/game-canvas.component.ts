import {Component, OnInit, ViewChild} from '@angular/core';
import {GameStateService} from '../../services/game-state.service';

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.scss']
})
export class GameCanvasComponent implements OnInit {

  @ViewChild('gameCanvas', {static: false}) gameCanvas;

  private x: number;
  private y: number;
  private ballRadius: number;

  constructor(
    private gameStateService: GameStateService
  ) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const canvas = this.gameCanvas.nativeElement;

    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.go();
  }

  getCanvasContext() {
    const canvas = this.getCanvasEl();
    return canvas.getContext('2d');
  }

  getCanvasEl() {
    return this.gameCanvas.nativeElement;
  }

  drawBots = (state) => {
    const ctx = this.getCanvasContext();

    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.fillStyle = state.color;
    ctx.fill();
    ctx.closePath();
  }

  go = () => {
    const canvas = this.getCanvasEl();
    console.log(canvas.width, canvas.height)
    const ctx = this.getCanvasContext();
    const gameState = this.gameStateService.updateGameState(canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameState.forEach(state => this.drawBots(state));

    requestAnimationFrame(this.go)

  }

}

