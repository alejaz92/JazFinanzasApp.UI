import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.css'],
    standalone: false
})
export class LoadingComponent {
  @Input() isLoading: boolean = false;
}
