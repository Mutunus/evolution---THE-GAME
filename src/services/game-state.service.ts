import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { v4 } from 'uuid';
import { GameEngineService } from './game-engine.service';

@Injectable({
  providedIn: 'root'
})
export class BotService {

  public bots: Bot[];
  private babyBots: Bot[];
  public food: Food[];

  private colors: string[];

  constructor(
    private gameEngine: GameEngineService
  ) {
    this.generateRandomColors();
    this.babyBots = [];
  }

  public nextTurn(canvasWidth: number, canvasHeight: number): Bot[] | Food[] {
    if(!this.bots) {
      this.food = this.generateRandomFood(canvasWidth, canvasHeight, 10, [])
      this.bots = this.generateRandomBots(canvasWidth, canvasHeight, 40, 4);
    }
    else {
      this.bots = this.bots
      .map(bot => this.botNextTurn(bot, canvasWidth, canvasHeight))
      .filter(bot => !bot.dead);

      this.spawnFood(canvasWidth, canvasHeight, 2, this.food)
      this.food = this.food.filter(food => !food.dead)
    }
    
    // TODO - form input for settings
    // TODO - spatial awareness
    // TODO - resolve combat
    // TODO - reproduce sexually

    // if any of the bots have given birth then add them to the bots array
    if(this.babyBots.length) {
      this.addBabyBots()
    }

    return [ ...this.bots, ...this.food ]
  }

  private botNextTurn(bot: Bot, canvasWidth: number, canvasHeight: number): Bot {
    // TODO - do bot stuff, mutate state
    const newPosition = this.calcPostion(bot, canvasWidth, canvasHeight);
    const newFoodAndRadius = this.eatFoodAndGrow(bot)
    const newAge = this.ageBots(bot)
    // if any of these returned false, then the bot is a dead mofo
    if(!newFoodAndRadius) {
      return { ...bot, dead: true }
    }
    
    const newPregnant = this.reproduce(bot)
    
    return {...bot, ...newPosition, ...newFoodAndRadius, ...newAge, ...newPregnant };
  }

  private addBabyBots(): void {
    this.bots = [...this.bots, ...this.babyBots]
    this.babyBots = []
  }

  generateRandomColors() {
    this.colors = _.fill(Array(10), null).map(x => '#'+Math.floor(Math.random()*16777215).toString(16))
  }

  private spawnFood(canvasWidth: number, canvasHeight: number, total: number, food: Food[]): void {
    if(_.random(1, 60) === 1) {
      const newFood = this.generateRandomFood(canvasWidth, canvasHeight, total, food);
      
      this.food = [...food, ...newFood]
    }
  }

  private generateRandomBots(canvasWidth: number, canvasHeight: number, total: number, species: number): Bot[] {
    let bots = []
    const botsPerSpecies = _.floor(total / species);
    
    for(species; species > 0; species--) {
      const speciesId = v4();

      // TODO - ensure bots of same species spawn bunch together
      const speciesColor = this.generateRandomSpeciesColor(species);

      for(let i = botsPerSpecies; i > 0; i--) {
        const botPos = this.generateRandomStartingPos(canvasWidth, canvasHeight, bots);
        const newBot = this.generateRandomBot(speciesId, botPos, speciesColor);
        bots.push(newBot);
      }
    }

    return bots;
  }

  private generateRandomFood(canvasWidth: number, canvasHeight: number, total: number, food: Food[]): Food[] {
    let newFood = []

    for(total; total > 0; total--) {
      const position = this.generateRandomStartingPos(canvasWidth, canvasHeight, food);

      newFood.push(new Food(position));
    }

    return newFood;
  }

  private generateRandomSpeciesColor(index: number) {
    return this.colors[index];
  }

  private generateRandomStartingPos(canvasWidth: number, canvasHeight: number, elements: Bot[] | Food[]): { x: number, y: number } {
    const x = _.random(BaseRadius, canvasWidth - BaseRadius)
    const y = _.random(BaseRadius, canvasHeight - BaseRadius)

    if(elements.some(el => this.gameEngine.areColliding(x, y, el.x, el.y, BaseRadius, el.radius))) {
      return this.generateRandomStartingPos(canvasWidth, canvasHeight, elements)
    }
    else return { x, y }
  }

  private generateRandomBot(speciesId: string, startingPos: { x: number, y: number }, color: string): Bot {
    return {
      speciesId,
      ...startingPos,
      color,
      radius: BaseRadius,
      maxRadius: BaseMaxRadius,
      speed: BaseSpeed,
      age: 0,
      growSpeed: BaseGrowSpeed,
      dx: _.random(0, 1) ? 1 : -1, 
      dy: _.random(0, 1) ? 1 : -1, 
      pregnant: null,
      gestationTime: BaseGestationTime,
      food: BaseFood
    }
  }

  private reproduce({ speciesId, pregnant, gestationTime, x, y, color, radius, maxRadius }: Bot): { pregnant: number } {
    if(!this.botIsAdult(radius, maxRadius)) return
    
    if(!pregnant) {
      // chance that the bot will fertilize itself
      if(_.random(1, 600) === 1) {
        return { pregnant: Date.now() }
      }
    }
    else {
      if(pregnant + gestationTime < Date.now()) {
        const babyBot = this.generateRandomBot(speciesId, { x, y }, color)
        this.babyBots.push(babyBot);
        
        return { pregnant: null }
      }
    }
  }

  private botIsAdult(radius: number, maxRadius: number): boolean {
    // if bot is 80% size of max size, then it is considered an adult
    return (radius / maxRadius) * 100 > 80
  }

  private botCollideWithFood(botX: number, botY: number, botRadius: number): number {
    const food = this.food.find(food => this.gameEngine.areColliding(food.x, food.y, botX, botY, food.radius, botRadius))
    if(food) {
      // bigger bots eat more food
      const botFoodConsumption = botRadius * 100;
      if(food.food - botFoodConsumption > 0) {
        food.food = food.food - botFoodConsumption;

        return botFoodConsumption
      }
      else {
        _.pull(this.food, food);

        return food.food;
      }
    }
    else return 0
  }

  private eatFoodAndGrow({ x, y, food, growSpeed, speed, radius, maxRadius }: Bot): { food: number, radius: number } {
    const foodEaten = this.botCollideWithFood(x, y, radius)
    const foodNeededForGrowth = this.getGrowthFoodRequirement(growSpeed, radius, maxRadius)
    const foodConsumption = foodNeededForGrowth + (radius * (speed * 2));

    if(foodConsumption > (food + foodEaten)) {
      return
    }
    else {
      const newRadius = foodNeededForGrowth ? radius + 1 : radius;

      return { food: (food + foodEaten) - foodConsumption, radius: newRadius }
    }
  }

  private ageBots({ age }: Bot): { age: number } {
    return { age: age + 1 }
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

    if(collideX || collideY) {
      return { x: currentX + (dx * speed), y: currentY + (dy * speed), dx, dy } 
    }

    // 9/10 keep going same direction
    if(_.random(0, 50) > 1) {
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
  age: number;
  growSpeed: number;
  pregnant: number;
  gestationTime: number;
  food: number;
  dead?: boolean;
}

export class Food {
  x: number;
  y: number;
  food: number;
  radius: number;
  color: string;
  dead?: boolean;

  constructor(params = {}) {
    this.x = _.get(params, 'x', 10);
    this.y = _.get(params, 'y', 10);
    this.food = _.get(params, 'food', 25000);
    this.radius = _.get(params, 'radius', 10);
    this.color = _.get(params, 'color', '#65ff00')
  }
}

const BaseRadius = 6
const BaseMaxRadius = 20
const BaseSpeed = 1;
const BaseGrowSpeed = 25;
const BaseFood = 50000
const BaseGestationTime = 5000