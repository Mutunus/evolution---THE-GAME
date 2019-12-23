import { Component, OnInit } from '@angular/core';
import {GameStateService} from '../../services/game-state.service';

@Component({
  selector: 'app-game-container',
  templateUrl: './game-container.component.html',
  styleUrls: ['./game-container.component.scss']
})
export class GameContainerComponent implements OnInit {

  constructor(
  ) { }

  ngOnInit() {
  }

}
