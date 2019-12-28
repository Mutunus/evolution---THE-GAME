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
    private botService: BotService
  ) {
  }

  ngOnInit() {
    const canvas = document.querySelector('canvas')

    canvas.width = innerWidth
    canvas.height = innerHeight

    addEventListener('resize', () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
    
      this.botService.restart()
    })
  }

  ngAfterViewInit() {
    this.go();
  }

  logBots() {
    console.log(this.botService.bots)
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
    const newMapState = this.botService.nextTurn(canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newMapState.forEach(state => this.drawBots(state));

    requestAnimationFrame(this.go)

  }

}

