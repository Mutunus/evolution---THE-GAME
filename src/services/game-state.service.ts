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
  private food: Food[];
  private colors: string[];
  private settings: GameSettings;

  constructor(
    private gameEngine: GameEngineService,
  ) {
    this.generateRandomColors();
    this.babyBots = [];
    this.settings = DevSettings
  }


  public init(canvasWidth: number, canvasHeight: number) {
    this.restart()
    this.nextTurn(canvasWidth, canvasHeight)
  }

  public restart() {
    this.bots = null
    this.food = null
  }

  public nextTurn(canvasWidth: number, canvasHeight: number): Bot[] | Food[] {
    if(!this.bots) {
      this.food = this.generateRandomFood(canvasWidth, canvasHeight, this.settings.totalFood)
      this.bots = this.generateRandomBots(canvasWidth, canvasHeight, this.settings.totalBots, this.settings.totalSpecies);
    }
    else {
      this.bots = this.bots
      .map(bot => this.botNextTurn(bot, canvasWidth, canvasHeight))
      .filter(bot => !bot.dead);

      this.spawnFood(canvasWidth, canvasHeight, 2, this.food)
      this.food = this.food.filter(food => !food.dead)
    }
    
    // TODO - mutation
    // TODO - form input for settings
    // TODO - spatial awareness
    // TODO - reproduce sexually

    // TODO - mouse click adds new species

    // if any of the bots have given birth then add them to the bots array
    if(this.babyBots.length) {
      this.addBabyBots()
    }

    return [ ...this.bots, ...this.food ]
  }

  private botNextTurn(bot: Bot, canvasWidth: number, canvasHeight: number): Bot {
    if(bot.dead) {
      return bot
    }

    const newFoodAndRadius = this.eatFoodAndGrow(bot)
    // if bot gained more food than it used then do not move
    const newPosition = _.get(newFoodAndRadius, 'food') < bot.food
    ? this.calcPostion(bot, canvasWidth, canvasHeight)
    : null
    const newAge = this.ageBots(bot)
    // if any of these returned false, then the bot is a dead mofo
    if(!newFoodAndRadius) {
      console.log('oh dear, i starved')
      return { ...bot, dead: true }
    }
    
    const newPregnant = this.reproduce(bot)
    
    return Object.assign(bot, {...newPosition, ...newFoodAndRadius, ...newAge, ...newPregnant });
  }

  private addBabyBots(): void {
    this.bots = [...this.bots, ...this.babyBots]
    this.babyBots = []
  }

  private generateRandomColors() {
    this.colors = _.fill(Array(10), null).map(x => this.generateRandomColor())
  }

  private generateRandomColor(): string {
    return '#'+Math.floor(Math.random()*16777215).toString(16)
  }

  private spawnFood(canvasWidth: number, canvasHeight: number, total: number, food: Food[]): void {
    if(_.random(1, 15) === 1) {
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
        const botPos = this.generateRandomStartingPos(canvasWidth, canvasHeight, bots, BaseRadius);
        const newBot = this.generateRandomBot(speciesId, botPos, speciesColor);
        bots.push(newBot);
      }
    }

    return bots;
  }

  private generateRandomFood(canvasWidth: number, canvasHeight: number, total: number, food?: Food[]): Food[] {
    let newFood = []

    for(total; total > 0; total--) {
      const position = this.generateRandomStartingPos(canvasWidth, canvasHeight, food || newFood, 8);

      newFood.push(new Food(position));
    }

    return newFood;
  }

  private generateRandomSpeciesColor(index: number) {
    return this.colors[index];
  }

  private generateRandomStartingPos(canvasWidth: number, canvasHeight: number, elements: Bot[] | Food[], radius): { x: number, y: number } {
    const x = _.random(radius, canvasWidth - radius)
    const y = _.random(radius, canvasHeight - radius)

    if(elements.some(el => this.gameEngine.areColliding(x, y, el.x, el.y, radius, el.radius))) {
      return this.generateRandomStartingPos(canvasWidth, canvasHeight, elements, radius)
    }
    else return { x, y }
  }

  private generateRandomBot(speciesId: string, startingPos: { x: number, y: number }, color: string, parent?: Bot): Bot {
    return {
      id: v4(),
      speciesId,
      parent: _.get(parent, 'id', null),
      ...startingPos,
      color,
      radius: parent ? BaseRadius : BaseMaxRadius,
      maxRadius: parent ? this.mutateValue(parent.radius, { min: 7, max: 30 }) : BaseMaxRadius,
      speed: parent ? this.mutateValue(parent.speed, { min: 1, max: 3, mutationChance: 5 }) : BaseSpeed,
      age: 0,
      growSpeed: parent ? this.mutateValue(parent.growSpeed, { min: 5, max: 200 }) : BaseGrowSpeed,
      dx: _.random(0, 1) ? 1 : -1, 
      dy: _.random(0, 1) ? 1 : -1, 
      pregnant: null,
      gestationTime: parent ? this.mutateValue(parent.gestationTime, { min: 1000, max: 10000 }) : BaseGestationTime,
      food: BaseFood,
      predation: parent ? this.mutatePredation(parent.predation) : PredationBehaviour.PASSIVE,
      moveStraightFrequency: parent ? this.mutateValue(parent.moveStraightFrequency, { min: 10, max: 500 }) : 75,
    }
  }

  private mutatePredation(predation: PredationBehaviour): PredationBehaviour {
    if(_.random(1, 100) === 1) {
      const predationValues = _.values(PredationBehaviour);
      const dieRoll = _.random(0, predationValues.length - 1)
      console.log('mutatePredation', predationValues[dieRoll])
      return predationValues[dieRoll]
    }
    else return predation
  }

  private speciationCheck() {
    if(_.random(1, 100) <= this.settings.speciationChance) {
      return {
        speciesId: v4(),
        color: this.generateRandomColor()
      }
    }
  }

  private mutateValue(value: number, { maxFluctuation = 10, mutationChance = this.settings.mutationChance, min, max }: { maxFluctuation?: number, min?: number, max?: number, mutationChance?: number }): number {
    const dieRoll = _.random(1, 100);

    if(dieRoll > mutationChance) {
      return value;
    }

    const percentageChange = _.random(0, maxFluctuation);
    const valueChange = _.ceil((value / 100) * percentageChange);
    const result = _.random(0, 1)
      ? value - valueChange
      : value + valueChange
    if(max && result > max) return max;
    if(min && result < min) return min;
    return result;
  }

  private reproduce(bot: Bot): { pregnant: number } {
    const { speciesId, pregnant, gestationTime, x, y, color, radius, maxRadius } = bot;

    if(!this.botIsAdult(radius, maxRadius)) return
    
    if(!pregnant) {
      // chance that the bot will fertilize itself
      if(_.random(1, 3000) === 1) {
        return { pregnant: Date.now() }
      }
    }
    else {
      if(pregnant + gestationTime < Date.now()) {
        console.log('i gave birth')
        const babyBot = this.generateRandomBot(speciesId, { x, y }, color, bot)
        const speciation = this.speciationCheck()
        this.babyBots.push(Object.assign(babyBot, speciation));

        return { pregnant: null }
      }
    }
  }

  private botIsAdult(radius: number, maxRadius: number): boolean {
    // if bot is 80% size of max size, then it is considered an adult
    return (radius / maxRadius) * 100 > 80
  }

  private botCollideWithBot(id: string, speciesId: string, botX: number, botY: number, botRadius: number, food: number, predation: PredationBehaviour): number {
    if(!this.botIsAggressive(predation)) {
      return 0
    }

    const collidingWithBot = this.bots.find(bot => {
      if(this.gameEngine.areColliding(bot.x, bot.y, botX, botY, bot.radius, botRadius) && bot.id != id && bot.speciesId != speciesId) {
        return bot
      }
    })
    if(collidingWithBot) {
      // if bot you are hitting is dead or your child or bot is opportunistic and target is bigger than you, then don't eat it
      if(collidingWithBot.dead 
        || collidingWithBot.parent === id 
        || (predation === PredationBehaviour.OPPORTUNISTIC && collidingWithBot.radius > botRadius)) {
        return 0;
      }
     // const combatResult = _.random(1, botRadius + collidingWithBot.radius)

      const attackerWin = this.gameEngine.botCombatResolver(botRadius, predation, collidingWithBot.radius, collidingWithBot.predation)

      if(!attackerWin && this.botIsAdult(collidingWithBot.radius, collidingWithBot.maxRadius)) {
        if(collidingWithBot.predation != PredationBehaviour.PASSIVE) {
          collidingWithBot.food += food;
        }
        console.log('i tried to eat a bot and died')
        return -1
      }
      else {
        console.log('i ate a bot')
        collidingWithBot.dead = true
        return collidingWithBot.food;
      }
    }
    return 0
  }

  private botIsAggressive(predation: PredationBehaviour): boolean {
    switch (predation) {
      case PredationBehaviour.PASSIVE:
        return false
      case PredationBehaviour.AGGRESSIVE:
      case PredationBehaviour.OPPORTUNISTIC:
        return true
      default:
        break;
    }
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

  private getSpeedMultiplier(speed) {
    switch (speed) {
      case 2:
        return 3
      case 3:
        return 5
      default:
        return speed
    }
  }

  private eatFoodAndGrow({ id, speciesId, x, y, food, growSpeed, speed, radius, maxRadius, predation }: Bot): { food: number, radius: number } {
    const foodEaten = this.botCollideWithFood(x, y, radius)
    const botsEaten = this.botIsAdult(radius, maxRadius) ? this.botCollideWithBot(id, speciesId, x, y, radius, food, predation) : 0
    const foodNeededForGrowth = this.getGrowthFoodRequirement(growSpeed, radius, maxRadius)
    const foodNeeded = foodNeededForGrowth + ((radius * 2) * (this.getSpeedMultiplier(speed) * 3));

    if(botsEaten < 0) {
      return
    }

    const totalFoodEaten = food + foodEaten + botsEaten 

    if(foodNeeded > totalFoodEaten) {
      return
    }
    else {
      const newRadius = foodNeededForGrowth ? radius + 1 : radius;

      return { food: totalFoodEaten - foodNeeded, radius: newRadius }
    }
  }

  private ageBots({ age }: Bot): { age: number } {
    return { age: age + 1 }
  }

  private getGrowthFoodRequirement(growSpeed: number, radius: number, maxRadius: number): number {
    if(radius === maxRadius) return 0;

    const dieRoll = _.random(1, 120000);

    if(dieRoll < growSpeed) {
      console.log('i grow')
      return growSpeed * 3
    }
    else return 0
  }

  private calcPostion(bot: Bot, canvasWidth: number, canvasHeight: number) {
    const { x, y, dx, dy, radius, speed, moveStraightFrequency } = bot;
    const newPosition = this.getMovementVals({ x, y, dx, dy }, moveStraightFrequency, radius, speed, canvasWidth, canvasHeight);

    return newPosition;
  }

  private getMovementVals({ x: currentX, y: currentY, dx: currentDx, dy: currentDy }: Partial<Bot>, moveStraightFrequency: number, radius: number, speed: number, canvasWidth: number, canvasHeight: number): { x: number, y: number, dx: number, dy: number } {
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
    if(_.random(0, moveStraightFrequency) > 1) {
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
  id: string;
  speciesId: string;
  parent: string;
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
  predation: PredationBehaviour;
  moveStraightFrequency: number;
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
    this.food = _.get(params, 'food', 50000);
    this.radius = _.get(params, 'radius', 8);
    this.color = _.get(params, 'color', '#65ff00')
  }
}

const BaseRadius = 5
const BaseMaxRadius = 9
const BaseSpeed = 1;
const BaseGrowSpeed = 25;
const BaseFood = 50000
const BaseGestationTime = 5000

export interface GameSettings {
  totalBots: number;
  totalSpecies: number;
  totalFood: number;
  mutationChance: number;
  speciationChance: number;
}

const DefaultSettings = {
  totalBots: 40,
  totalSpecies: 4,
  totalFood: 250,
  mutationChance: 2,
  speciationChance: 1,
}

const DevSettings = {
  totalBots: 80,
  totalSpecies: 8,
  totalFood: 250,
  mutationChance: 2,
  speciationChance: 1
}

export enum PredationBehaviour {
  PASSIVE = 'passive',
  OPPORTUNISTIC = 'opportunistic',
  AGGRESSIVE = 'aggressive'
}