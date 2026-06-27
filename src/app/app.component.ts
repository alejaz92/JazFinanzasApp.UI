import { Component } from '@angular/core';
import { AppInitializerService } from './shared/services/app-initializer.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  title = 'JazFinanzasApp';

  constructor() {
    
  

  }
}
