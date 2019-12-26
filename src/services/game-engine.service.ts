import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {

  constructor() { }

  public areColliding(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
    const distance = this.getDistance(x1, y1, x2, y2);

    return distance < r1 + r2;
  }

  // if return is 0 then elements are in same position
  public getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const xDist = x2 - x1;
    const yDist = y2 - y1;

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))
  }

}
