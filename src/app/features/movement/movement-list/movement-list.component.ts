import { Component, OnInit } from '@angular/core';
import { Movement } from '../models/movement.model';
import { MovementService } from '../services/movement.service';

@Component({
  selector: 'app-movement-list',
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.css']
})
export class MovementListComponent implements OnInit {
  movements: Movement[] = []; 
  page: number = 1;
  totalMovements: number = 0;

  constructor(private movementService: MovementService) { }

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements() {
    this.movementService.getMovements(this.page,20)
      .subscribe(response => {
        console.log(response); 
        this.movements = response.movements; 
        this.totalMovements = response.totalCount;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadMovements();


    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
