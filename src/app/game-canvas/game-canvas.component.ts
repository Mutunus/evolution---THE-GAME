import {Component, OnInit, ViewChild} from '@angular/core';
import {BotService} from '../../services/game-state.service';

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.scss']
})
export class GameCanvasComponent implements OnInit {

  @ViewChild('gameCanvas', {static: false}) gameCanvas;

  constructor(
    private BotService: BotService
  ) {
  }

  ngOnInit() {
    //document.addEventListener('mousemove', e => console.log(e.offsetX, e.offsetY))
  }

  ngAfterViewInit() {
    const canvas = this.gameCanvas.nativeElement;

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
    const ctx = this.getCanvasContext();
    const Bot = this.BotService.nextTurn(canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Bot.forEach(state => this.drawBots(state));

    requestAnimationFrame(this.go)

  }

}

