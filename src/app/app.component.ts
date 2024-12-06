import { Component } from '@angular/core';
import { AppInitializerService } from './shared/services/app-initializer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoading = true;
  title = 'JazFinanzasApp';

  constructor(appInitializerService: AppInitializerService) {
    
    
    appInitializerService.checkAuthStatus().subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });

    
  }
}
