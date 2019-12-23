import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  public gameState: GameState[];

  private dx: number;
  private dy: number;

  constructor() {
    this.dx = 2;
    this.dy = 2;
  }

  // TODO - store all bots
  // TODO - bots eat food

  public generateGameState() {
    return [
      { x: 150, y: 150, color: "#0095DD", radius: 12, speed: 1, dx: BaseMovementSpeed, dy: BaseMovementSpeed },
      { x: 200, y: 200, color: "#f79633", radius: 12, speed: 1, dx: -BaseMovementSpeed, dy: -BaseMovementSpeed }

    ]
  }

  public updateGameState(canvasWidth: number, canvasHeight: number): GameState[] {
    if(!this.gameState) {
      this.gameState = this.generateGameState();
      return this.gameState;
    }
    // TODO - randomize positions
    this.gameState = this.gameState.map(bot => this.updatePostion(bot, canvasWidth, canvasHeight));
    return this.gameState

    // TODO - resolve combat
  }

  public updatePostion(bot: GameState, canvasWidth: number, canvasHeight: number) {
    const { x, y, dx, dy, radius, speed } = bot;
    const newPosition = this.getMovementVals(x, y, dx, dy, radius, speed, canvasWidth, canvasHeight);

    return Object.assign({}, bot, newPosition)
  }

  private getMovementVals(currentX: number, currentY: number, currentDx: number, currentDy: number, radius: number, speed: number, canvasWidth: number, canvasHeight: number): { x: number, y: number, dx: number, dy: number } {
    let dx = currentDx * speed;
    let dy = currentDy * speed;


    if(currentX + currentDx > (canvasWidth - radius) || currentX + currentDx < radius) {
      dx = -dx;
    }
    if(currentY + currentDy > (canvasHeight - radius) || currentY + currentDy < radius) {
      dy = -dy;
    }

    return { x: currentX + dx, y: currentY + dy, dx, dy }
  }

}


export interface GameState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  radius: number;
  speed: number;
}

const BaseMovementSpeed = 2;
