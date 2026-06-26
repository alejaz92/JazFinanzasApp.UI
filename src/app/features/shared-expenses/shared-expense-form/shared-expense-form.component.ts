import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { SharedExpenseFormData, SharedExpenseSplitType, SplitInput } from '../models/shared-expense.model';
import { PersonService } from '../../people/services/person.service';
import { Person } from '../../people/models/person.model';

interface SplitRow {
  personId: number;
  personName: string;
  amount: number;
  percentage: number;
}

@Component({
  selector: 'app-shared-expense-form',
  templateUrl: './shared-expense-form.component.html',
  styleUrls: ['./shared-expense-form.component.css']
})
export class SharedExpenseFormComponent implements OnInit, OnChanges {
  @Input() totalAmount: number = 0;
  @Output() formChange = new EventEmitter<SharedExpenseFormData | null>();

  people: Person[] = [];
  rows: SplitRow[] = [];
  splitMode: 'equal' | 'amount' | 'percentage' = 'equal';
  selectedPersonId: string = '';
  notes: string = '';

  constructor(private personService: PersonService) {}

  ngOnInit(): void {
    this.personService.getAllPeople().subscribe((data: Person[]) => {
      this.people = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalAmount']) {
      this.recalculate();
    }
  }

  get availablePeople(): Person[] {
    const addedIds = new Set(this.rows.map(r => r.personId));
    return this.people.filter(p => !addedIds.has(p.id));
  }

  get sumOfSplits(): number {
    return Math.round(this.rows.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
  }

  get userShare(): number {
    return Math.round((this.totalAmount - this.sumOfSplits) * 100) / 100;
  }

  get sumOfPercentages(): number {
    return Math.round(this.rows.reduce((sum, r) => sum + r.percentage, 0) * 100) / 100;
  }

  get isValid(): boolean {
    return this.rows.length > 0
      && this.userShare >= 0
      && this.rows.every(r => r.amount > 0);
  }

  addPerson(): void {
    if (!this.selectedPersonId) return;
    const id = Number(this.selectedPersonId);
    const person = this.people.find(p => p.id === id);
    if (!person) return;

    this.rows.push({
      personId: person.id,
      personName: person.alias || person.name,
      amount: 0,
      percentage: 0
    });
    this.selectedPersonId = '';
    this.recalculate();
  }

  removePerson(index: number): void {
    this.rows.splice(index, 1);
    this.recalculate();
  }

  onModeChange(): void {
    this.recalculate();
  }

  recalculate(): void {
    if (this.splitMode === 'equal') {
      const n = this.rows.length + 1;
      const amountPerPerson = n > 1 ? this.totalAmount / n : 0;
      const rounded = Math.round(amountPerPerson * 100) / 100;
      const pct = n > 1 ? Math.round((100 / n) * 100) / 100 : 0;
      this.rows.forEach(r => {
        r.amount = rounded;
        r.percentage = pct;
      });
    } else if (this.splitMode === 'percentage') {
      this.rows.forEach(r => {
        r.amount = Math.round((this.totalAmount * r.percentage / 100) * 100) / 100;
      });
    }
    this.emit();
  }

  onAmountChange(row: SplitRow): void {
    if (this.totalAmount > 0) {
      row.percentage = Math.round((row.amount / this.totalAmount * 100) * 100) / 100;
    }
    this.emit();
  }

  onPercentageChange(row: SplitRow): void {
    row.amount = Math.round((this.totalAmount * row.percentage / 100) * 100) / 100;
    this.emit();
  }

  onNotesChange(): void {
    this.emit();
  }

  reset(): void {
    this.rows = [];
    this.splitMode = 'equal';
    this.selectedPersonId = '';
    this.notes = '';
    this.emit();
  }

  private emit(): void {
    if (!this.isValid) {
      this.formChange.emit(null);
      return;
    }

    const splits: SplitInput[] = this.rows.map(r => ({
      personId: r.personId,
      splitType: SharedExpenseSplitType.Person,
      amount: r.amount
    }));

    this.formChange.emit({
      splits,
      notes: this.notes
    });
  }
}
