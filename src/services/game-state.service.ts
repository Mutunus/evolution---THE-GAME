import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { v4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class BotService {

  public bots: Bot[];
  private colors: string[];

  constructor() {
    this.generateRandomColors()
  }

  // TODO - store all bots
  // TODO - bots eat food

  generateRandomColors() {
    this.colors = _.fill(Array(10), null).map(x => '#'+Math.floor(Math.random()*16777215).toString(16))
  }

  private generateRandomBots(canvasWidth: number, canvasHeight: number, total: number, species: number): Bot[] {
    let bots = []
    const botsPerSpecies = _.floor(total / species);
    
    for(species; species > 0; species--) {
      const speciesId = v4();
      const speciesStartingPos = this.generateRandomStartingPos(canvasWidth, canvasHeight);
      const speciesColor = this.generateRandomSpeciesColor(species);

      for(let i = botsPerSpecies; i > 0; i--) {
        const newBot = this.generateRandomBot(speciesId, speciesStartingPos, speciesColor);
        bots.push(newBot);
      }
    }

    return bots;
  }

  private generateRandomSpeciesColor(index: number) {
    return this.colors[index];
  }

  private generateRandomStartingPos(canvasWidth: number, canvasHeight: number): { x: number, y: number } {
    return {
      x: _.random(BaseRadius, canvasWidth - BaseRadius),
      y: _.random(BaseRadius, canvasHeight - BaseRadius)
    }
  }

  private generateRandomBot(speciesId: string, startingPos: { x: number, y: number }, color: string): Bot {
    return {
      speciesId,
      ...startingPos,
      color,
      radius: BaseRadius,
      maxRadius: BaseMaxRadius,
      speed: BaseSpeed,
      growSpeed: BaseGrowSpeed,
      dx: _.random(0, 1) ? 1 : -1, 
      dy: _.random(0, 1) ? 1 : -1, 
      pregnant: 0,
      gestationTime: 6,
      food: BaseFood
    }
  }

  public updateBot(canvasWidth: number, canvasHeight: number): Bot[] {
    if(!this.bots) {
      this.bots = this.generateRandomBots(canvasWidth, canvasHeight, 20, 4);
      return this.bots;
    }
    this.bots = this.bots
    .map(bot => this.botNextTurn(bot, canvasWidth, canvasHeight))
    .filter(Boolean)

    return this.bots
    
    // TODO - plant bots
    // TODO - see surroundings
    // TODO - DIE
    // TODO - eat + grow
    // TODO - pick up food
    // TODO - resolve combat
    // TODO - reproduce
  }

  private reproduce() {
    // TODO reproduce asexually
    // TODO - reproduce sexually
  }

  private botNextTurn(bot: Bot, canvasWidth: number, canvasHeight: number) {
    // TODO - do bot stuff, mutate state
    const newPosition = this.calcPostion(bot, canvasWidth, canvasHeight);
    const newFoodAndRadius = this.eatFoodAndGrow(bot)

    // if any of these returned false, then the bot is a dead mofo
    if(!newFoodAndRadius) {
      return
    }
    
    return {...bot, ...newPosition, ...newFoodAndRadius };
  }

  private eatFoodAndGrow({ food, growSpeed, speed, radius, maxRadius }: Bot): { food: number, radius: number } {
    const foodNeededForGrowth = this.getGrowthFoodRequirement(growSpeed, radius, maxRadius)
    const foodConsumption = foodNeededForGrowth + (radius * (speed * 2));

    if(foodConsumption > food) {
      return
    }
    else {
      const newRadius = foodNeededForGrowth ? radius + 1 : radius;

      return { food: food - foodConsumption, radius: newRadius }
    }
  }

  private getGrowthFoodRequirement(growSpeed: number, radius: number, maxRadius: number): number {
    if(radius === maxRadius) return 0;

    const compareNum = 2500 - growSpeed;
    const dieRoll = _.random(0, 2500);

    if(dieRoll > compareNum) {
      return growSpeed * 3
    }
    else return 0
  }

  private calcPostion(bot: Bot, canvasWidth: number, canvasHeight: number) {
    const { x, y, dx, dy, radius, speed } = bot;
    const newPosition = this.getMovementVals({ x, y, dx, dy }, radius, speed, canvasWidth, canvasHeight);

    return newPosition;
  }

  private getMovementVals({ x: currentX, y: currentY, dx: currentDx, dy: currentDy }: Partial<Bot>, radius: number, speed: number, canvasWidth: number, canvasHeight: number): { x: number, y: number, dx: number, dy: number } {
    let dx = currentDx;
    let dy = currentDy;

    const collideX = this.isGoingToHitWall(currentX, currentDx, radius, canvasWidth);
    const collideY = this.isGoingToHitWall(currentY, currentDy, radius, canvasHeight);

    if(collideX) {
      dx = -dx;
    }
    if(collideY) {
      dy = -dy;
    }

    console.log(collideX, collideY)

    if(collideX || collideY) {
      return { x: currentX + (dx * speed), y: currentY + (dy * speed), dx, dy } 
    }

    // 9/10 keep going same direction
    if(_.random(0, 10) > 1) {
      return { x: currentX + (dx * speed), y: currentY + (dy * speed), dx, dy }
    }
    else {
    // TODO - else randomize direction
      const randomDx = this.randomizeDirection(speed)
      const randomDy = this.randomizeDirection(speed)

      return { x: currentX + (randomDx * speed), y: currentY + (randomDy * speed), dx: randomDx, dy: randomDy }
    }
    
  }

  randomizeDirection(speed: number): number {
    const options = [
      -speed,
      speed
    ];

    return(options[_.random(0, 5)] || 0)
  }

  isGoingToHitWall(point: number, direction: number, radius: number, canvasWidth: number): boolean {
    if(point + direction > (canvasWidth - radius) || point + direction < radius) {
      return true
    }
  }

}


export interface Bot {
  speciesId: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  radius: number;
  maxRadius: number;
  speed: number;
  growSpeed: number;
  pregnant: number;
  gestationTime: number;
  food: number;
}

const BaseRadius = 6
const BaseMaxRadius = 20
const BaseSpeed = 1;
const BaseGrowSpeed = 25;
const BaseFood = 50000