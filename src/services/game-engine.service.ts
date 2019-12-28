import { Injectable } from '@angular/core';
import { PredationBehaviour } from './game-state.service';
import * as _ from 'lodash'

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

  public botCombatResolver(attackerRadius: number, attackerPredation: PredationBehaviour, defenderRadius: number, defenderPredation: PredationBehaviour) {
    // TODO - take into account predation style
    const attackerAdvantage = attackerRadius > defenderRadius;
    const attackerMultiplier = attackerAdvantage ? this.determineCombatMultiplier(attackerRadius, attackerPredation, defenderRadius, defenderPredation) : 1
    const defenderMultiplier = attackerAdvantage ? 1 : this.determineCombatMultiplier(defenderRadius, defenderPredation, attackerRadius, attackerPredation)
    const attackRoll = _.random(1, _.ceil(attackerRadius * attackerMultiplier))
    const defendRoll = _.random(1, _.ceil(defenderRadius * defenderMultiplier))
    const attackerWin = attackRoll > defendRoll;

    console.log(attackerRadius, defenderRadius)
    console.log(attackerMultiplier, defenderMultiplier)
    console.log(attackRoll, defendRoll)
    return attackerWin
  }

  private determineCombatMultiplier(attackerRadius: number, attackerPredation: PredationBehaviour, defenderRadius: number, defenderPredation: PredationBehaviour): number {
    const passiveDefender = defenderPredation === PredationBehaviour.PASSIVE ? 0.5 : 0;
    const attackerSizeAdvantage = attackerRadius / defenderRadius
    if(attackerSizeAdvantage < 1.2) {
      return 1 + passiveDefender
    }
    if(attackerSizeAdvantage < 1.5) {
      return 1.5 + passiveDefender
    }
    if(attackerSizeAdvantage < 1.75) {
      return 2 + passiveDefender
    }
    if(attackerSizeAdvantage > 1.75) {
      return 3 + passiveDefender
    }
  }


}
