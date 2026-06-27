import { Component } from '@angular/core';
import { AppInitializerService } from './shared/services/app-initializer.service';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './core/components/footer/footer.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [NavbarComponent, RouterOutlet, FooterComponent]
})
export class AppComponent {
  title = 'JazFinanzasApp';

  constructor() {
    
  

  }
}
