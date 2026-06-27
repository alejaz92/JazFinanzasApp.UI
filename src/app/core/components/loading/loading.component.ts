import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.css'],
    imports: [NgIf]
})
export class LoadingComponent {
  @Input() isLoading: boolean = false;
}
