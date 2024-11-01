import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardMovementsService } from '../../services/card-movements.service';
import { HttpClient } from '@angular/common/http';
import { Movement } from 'src/app/features/movement/models/movement.model';
import { MovementClassService } from 'src/app/features/movementClass/services/movement-class.service';
import { AssetService } from 'src/app/features/asset/services/asset.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardMovementsAdd } from '../../models/cardMovements-add.model';
import { first } from 'rxjs';

@Component({
  selector: 'app-card-movements-add',
  templateUrl: './card-movements-add.component.html',
  styleUrls: ['./card-movements-add.component.css']
})
export class CardMovementsAddComponent implements OnInit {
  cardMovementForm!: FormGroup;
  selectedMovementType: string = '';
  assets: any[] = [];
  expenseClasses: any[] = [];
  cards: any[] = [];

  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private cardMovementService: CardMovementsService,
    private movementClassesService: MovementClassService,
    private assetService: AssetService,
    private cardService: CardService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cardMovementForm = this.fb.group({
      movementType: ['', Validators.required],
      date: ['', Validators.required],
      asset: ['', Validators.required],
      totalAmount: ['', Validators.required],
      detail: ['', Validators.required],
      card: ['', Validators.required],
      expenseClass: ['', Validators.required],
      installments: [1],
      firstInstallmentDate: ['', Validators.required],
      lastInstallmentDate: [''],
    });

    //this.assignFirstInstallment();
    this.loadAssets();
    this.loadExpenseClasses();
    this.loadCards();
  }

  loadAssets() {
    this.assetService.getCardAssets().subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadExpenseClasses() {
    this.movementClassesService.getAllMovementClasses().subscribe((data: any) => {
      this.expenseClasses = data.filter((item: any) => item.incExp === 'E');
    });
  }

  loadCards() {
    this.cardService.getAllCards().subscribe((data: any) => {
      this.cards = data;
    });
  }

  onMovementTypeChange(event: any) {
    this.selectedMovementType = event.target.value;
    //this.updateInstallments();
  }

  onSubmit() {
    const formValues = this.cardMovementForm.value;

    if (formValues.movementType === '') {
      this.cardMovementForm.controls['movementType'].setErrors({ 'incorrect': true });
    }

    if(formValues.date === '') {
      this.cardMovementForm.controls['date'].setErrors({ 'incorrect': true });
    }

    if (formValues.asset === '') {
      this.cardMovementForm.controls['asset'].setErrors({ 'incorrect': true });
    }

    if (formValues.card === '') {
      this.cardMovementForm.controls['card'].setErrors({ 'incorrect': true });
    }

    if (formValues.expenseClass === '') {
      this.cardMovementForm.controls['expenseClass'].setErrors({ 'incorrect': true });
    }

    if (formValues.detail === '') {
      this.cardMovementForm.controls['detail'].setErrors({ 'incorrect': true });
    }

    if (formValues.totalAmount === '') {
      this.cardMovementForm.controls['totalAmount'].setErrors({ 'incorrect': true });
    }

    if(formValues.firstInstallmentDate === '') {
      this.cardMovementForm.controls['firstInstallmentDate'].setErrors({ 'incorrect': true });
    }

    if (formValues.movementType === 'U') {
      if (formValues.installments === '') {
        this.cardMovementForm.controls['installments'].setErrors({ 'incorrect': true });
      }
    }

    const [year, month] = formValues.firstInstallmentDate.split('-');

    var cardMovementAdd: CardMovementsAdd = {
      date: formValues.date,
      detail: formValues.detail,
      cardId: parseInt(formValues.card),
      movementClassId: parseInt(formValues.expenseClass),
      assetId: parseInt(formValues.asset),
      totalAmount: parseFloat(formValues.totalAmount) || 0,
      installments: parseInt(formValues.installments) || 1,
      firstInstallment: formValues.firstInstallmentDate + '-01',
      repeat: "NO"
    };

    // console.log(Number(formValues.totalAmount));
    // console.log(formValues.totalAmount);

    if (formValues.movementType === 'R') {

      cardMovementAdd.repeat = "YES";

    }
    else {
      cardMovementAdd.lastInstallment = formValues.lastInstallmentDate + '-01';
    }


    this.cardMovementService.addCardMovement(cardMovementAdd).subscribe((data: any) => {
      this.cardMovementForm.reset();
      this.cardMovementForm.controls['totalAmount'].setValue(0); 
      this.cardMovementForm.controls['installments'].setValue(1); 
      this.successMessage = 'Gasto Tarjeta agregado correctamente';

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    });

    
  }

  updateInstallments() {
    if (this.selectedMovementType === 'U') {
      const [year, month] = this.cardMovementForm.value.firstInstallmentDate.split('-').map(Number);
    
      // Crear la fecha en el primer día del mes seleccionado
      const firstInstallmentDate = new Date(year, month - 1, 1);

      let lastInstallmentDate = new Date(firstInstallmentDate);

      lastInstallmentDate.setMonth(firstInstallmentDate.getMonth() + this.cardMovementForm.value.installments - 1);

      this.cardMovementForm.controls['lastInstallmentDate'].setValue(this.formatDateToMonth(lastInstallmentDate));
    }
  }

  assignFirstInstallment() {

    const date = new Date(this.cardMovementForm.controls['date'].value);
    const lastThursday = this.getLastThursday(date.getFullYear(), date.getMonth());


    // Comparación de fechas completa en lugar de solo días
    if (date > lastThursday) {
      const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1);
      this.cardMovementForm.controls['firstInstallmentDate'].setValue(this.formatDateToMonth(nextMonthDate));
    } else {
      this.cardMovementForm.controls['firstInstallmentDate'].setValue(this.formatDateToMonth(date));
    }

    this.updateInstallments();
  }

  // Función para obtener el último jueves del mes
  getLastThursday(year: number, month: number): Date {
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Retrocede hasta encontrar el último jueves
    while (lastDayOfMonth.getDay() !== 4) {
      lastDayOfMonth.setDate(lastDayOfMonth.getDate() - 1);
    }

    return lastDayOfMonth;
  }

  // Formatea la fecha a "YYYY-MM" para el campo de tipo month
  formatDateToMonth(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}`;
  }
}
