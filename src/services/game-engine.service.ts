import { Injectable } from '@angular/core';
import { PredationBehaviour } from './game-state.service';
import * as _ from 'lodash'

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {

  constructor() {}

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

  public botCombatResolver(attackerRadius: number, attackerMaxRadius: number, attackerPredation: PredationBehaviour, defenderRadius: number, defenderMaxRadius: number, defenderPredation: PredationBehaviour) {
    // TODO - take into account predation style
    const attackerAdvantage = attackerRadius >= defenderRadius;
    const attackerMultiplier = attackerAdvantage ? this.determineCombatMultiplier(attackerRadius, attackerMaxRadius, attackerPredation, defenderRadius, defenderMaxRadius, defenderPredation) : 1
    const defenderMultiplier = attackerAdvantage ? this.botIsAggressive(defenderPredation) ? 1 : 0.75 : this.determineCombatMultiplier(defenderRadius, defenderMaxRadius, defenderPredation, attackerRadius, attackerMaxRadius, attackerPredation)
    const attackRoll = _.random(1, _.ceil(attackerRadius * attackerMultiplier))
    const defendRoll = _.random(1, _.ceil(defenderRadius * defenderMultiplier))
    const attackerWin = attackRoll > defendRoll;

    console.log(_.ceil(attackerRadius * attackerMultiplier), _.ceil(defenderRadius * defenderMultiplier))
    console.log(attackerMultiplier, defenderMultiplier)
    console.log(attackRoll, defendRoll)
    console.log(attackerWin, attackRoll > defendRoll)
    return attackerWin
  }

  public botIsAggressive(predation: PredationBehaviour): boolean {
    switch (predation) {
      case PredationBehaviour.PASSIVE:
        return false
      case PredationBehaviour.AGGRESSIVE:
      case PredationBehaviour.OPPORTUNISTIC:
      case PredationBehaviour.OMNIVORE:
        return true
      default:
        break;
    }
  } 

  private determineCombatMultiplier(attackerRadius: number, attackerMaxRadius: number, attackerPredation: PredationBehaviour, defenderRadius: number, defenderMaxRadius: number, defenderPredation: PredationBehaviour): number {
    const passiveDefender = defenderPredation === PredationBehaviour.PASSIVE ? 0.5 : 0;
    const passiveAttacker = attackerPredation === PredationBehaviour.PASSIVE;
    const defenderIsChild = this.botIsAdult(defenderRadius, defenderMaxRadius) ? 0 : 0.5;
    const attackerIsChild = this.botIsAdult(attackerRadius, attackerMaxRadius)
    const attackerSizeAdvantage = attackerRadius / defenderRadius

    if(passiveAttacker || attackerIsChild) {
      return 0.75
    }

    if(attackerSizeAdvantage < 1.2) {
      return 1 + passiveDefender + defenderIsChild
    }
    if(attackerSizeAdvantage < 1.5) {
      return 1.5 + passiveDefender + defenderIsChild
    }
    if(attackerSizeAdvantage < 1.75) {
      return 2 + passiveDefender + defenderIsChild
    }
    if(attackerSizeAdvantage >= 1.75) {
      return 3 + passiveDefender + defenderIsChild
    }
  }

  public botIsAdult(radius: number, maxRadius: number): boolean {
    // if bot is 80% size of max size, then it is considered an adult
    return (radius / maxRadius) * 100 > 80
  }

  public omnivoreIsHungry(predation: PredationBehaviour, food: number) {
    return predation === PredationBehaviour.OMNIVORE && food < 50000
  }


}
