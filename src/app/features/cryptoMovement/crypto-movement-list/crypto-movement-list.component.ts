import { Component, OnInit } from '@angular/core';
import { CryptoMovementService } from '../services/crypto-movement.service';
import { CryptoMovement } from '../models/CryptoMovement.model';

@Component({
  selector: 'app-crypto-movement-list',
  templateUrl: './crypto-movement-list.component.html',
  styleUrls: ['./crypto-movement-list.component.css']
})
export class CryptoMovementListComponent implements OnInit{
  cryptoMovements: CryptoMovement[] = [];
  page: number = 1;
  totalCryptoMovements: number = 0;
  
  constructor(private cryptoMovementService: CryptoMovementService) { }

  ngOnInit(): void {
    this.loadCryptoMovements();
  }

  loadCryptoMovements() {
    this.cryptoMovementService.getCryptoMovements(this.page, 20)
      .subscribe(response => {
        this.cryptoMovements = response.movements; 

        this.totalCryptoMovements = response.totalCount;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadCryptoMovements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteMovement(cryptoMovement: CryptoMovement) {
    if (!confirm(`¿Estás seguro de eliminar el movimiento?`)) {
      return
    }
    this.cryptoMovementService.deleteCryptoMovement(cryptoMovement.id)
      .subscribe(() => {
        this.loadCryptoMovements();
      });
  }
}
