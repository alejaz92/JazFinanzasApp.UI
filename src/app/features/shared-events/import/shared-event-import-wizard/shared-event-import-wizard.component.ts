import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { SharedEventService } from '../../services/shared-event.service';
import {
  SharedEventListItem,
  SharedEventImportParseResult,
  SharedEventImportRow,
  SharedEventImportRowAction,
  SharedEventImportRowDecision,
  SharedEventImportMemberMapping,
  SharedEventImportCategoryMapping,
  SharedEventImportConfirmResult
} from '../../models/shared-event.model';
import { PersonService } from '../../../people/services/person.service';
import { Person } from '../../../people/models/person.model';
import { TransactionClassService } from '../../../transactionClass/services/transaction-class.service';
import { AccountService } from '../../../account/services/account.service';
import { CardService } from '../../../card/services/card.service';
import { LoadingComponent } from '../../../../core/components/loading/loading.component';
import { ToastService } from '../../../../core/services/toast.service';

interface MemberMappingRow {
  name: string;
  mode: 'me' | 'existing' | 'new';
  personId: string;
  newPersonName: string;
}

interface CategoryMappingRow {
  name: string;
  mode: 'existing' | 'new';
  transactionClassId: string;
  newCategoryName: string;
}

interface RowDecisionRow {
  row: SharedEventImportRow;
  action: SharedEventImportRowAction;
  selectedMatchKey: string; // '' | 'tx:<id>' | 'card:<id>'
  paymentMode: 'account' | 'card';
  accountId: string;
  cardId: string;
  installments: number;
  firstInstallment: string; // 'yyyy-MM'
}

@Component({
  selector: 'app-shared-event-import-wizard',
  templateUrl: './shared-event-import-wizard.component.html',
  imports: [LoadingComponent, NgIf, NgFor, FormsModule, DecimalPipe, DatePipe]
})
export class SharedEventImportWizardComponent implements OnInit {
  isLoading: boolean = false;
  step: 1 | 2 | 3 | 4 = 1;
  errorMessage: string = '';

  // ── Paso 1 ──
  events: SharedEventListItem[] = [];
  selectedEventId: string = '';
  creatingNewEvent: boolean = false;
  newEventName: string = '';
  csvContent: string = '';
  csvFileName: string = '';

  // ── Paso 2 ──
  parseResult: SharedEventImportParseResult | null = null;
  memberMappings: MemberMappingRow[] = [];
  categoryMappings: CategoryMappingRow[] = [];
  allPeople: Person[] = [];
  transactionClasses: any[] = [];

  // ── Paso 3 ──
  rowDecisions: RowDecisionRow[] = [];
  defaultAccountId: string = '';
  accounts: any[] = [];
  cards: any[] = [];

  // ── Paso 4 ──
  confirmResult: SharedEventImportConfirmResult | null = null;

  constructor(
    private sharedEventService: SharedEventService,
    private personService: PersonService,
    private transactionClassService: TransactionClassService,
    private accountService: AccountService,
    private cardService: CardService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.sharedEventService.getAll(false).subscribe(data => this.events = data);
    this.personService.getAllPeople().subscribe(data => this.allPeople = data);
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {
      this.transactionClasses = data.filter((c: any) => c.incExp === 'E');
    });
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => this.accounts = data);
    this.cardService.getAllCards().subscribe((data: any) => this.cards = data);
  }

  // ── Paso 1 ──────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.csvFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => { this.csvContent = reader.result as string; };
    reader.readAsText(file, 'utf-8');
  }

  get step1Valid(): boolean {
    const hasEvent = this.creatingNewEvent ? !!this.newEventName.trim() : !!this.selectedEventId;
    return !!this.csvContent && hasEvent;
  }

  onStep1Next(): void {
    if (!this.step1Valid) return;
    this.errorMessage = '';
    this.isLoading = true;

    const proceed = (eventId: number) => {
      this.selectedEventId = String(eventId);
      this.sharedEventService.parseImport({ csvContent: this.csvContent }).subscribe({
        next: (result) => {
          this.parseResult = result;
          this.buildMappingRows(result);
          this.isLoading = false;
          this.step = 2;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message ?? 'Error al interpretar el archivo';
        }
      });
    };

    if (this.creatingNewEvent) {
      this.sharedEventService.create({ name: this.newEventName, personIds: [] }).subscribe({
        next: (created) => proceed(created.id),
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message ?? 'Error al crear el evento';
        }
      });
    } else {
      proceed(Number(this.selectedEventId));
    }
  }

  private buildMappingRows(result: SharedEventImportParseResult): void {
    this.memberMappings = result.members.map(m => ({
      name: m.name,
      mode: m.suggestedPersonId ? 'existing' : 'new',
      personId: m.suggestedPersonId ? String(m.suggestedPersonId) : '',
      newPersonName: m.suggestedPersonId ? '' : m.name
    }));

    this.categoryMappings = result.categories.map(c => ({
      name: c.name,
      mode: c.suggestedTransactionClassId ? 'existing' : 'new',
      transactionClassId: c.suggestedTransactionClassId ? String(c.suggestedTransactionClassId) : '',
      newCategoryName: c.suggestedTransactionClassId ? '' : c.name
    }));
  }

  // ── Paso 2 ──────────────────────────────────────────────────────────────

  get currentUserMemberName(): string | null {
    return this.memberMappings.find(m => m.mode === 'me')?.name ?? null;
  }

  get step2Valid(): boolean {
    const meCount = this.memberMappings.filter(m => m.mode === 'me').length;
    if (meCount !== 1) return false;

    const membersOk = this.memberMappings.every(m =>
      m.mode === 'me' || (m.mode === 'existing' && !!m.personId) || (m.mode === 'new' && !!m.newPersonName.trim()));

    const categoriesOk = this.categoryMappings.every(c =>
      (c.mode === 'existing' && !!c.transactionClassId) || (c.mode === 'new' && !!c.newCategoryName.trim()));

    return membersOk && categoriesOk;
  }

  onStep2Next(): void {
    if (!this.step2Valid || !this.parseResult) return;
    this.errorMessage = '';
    this.isLoading = true;

    // re-parsear ahora que ya sabemos quién es "yo", para traer sugerencias de Transaction/CardTransaction existentes
    this.sharedEventService.parseImport({
      csvContent: this.csvContent,
      currentUserMemberName: this.currentUserMemberName ?? undefined
    }).subscribe({
      next: (result) => {
        this.parseResult = result;
        this.buildRowDecisions(result);
        this.isLoading = false;
        this.step = 3;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message ?? 'Error al recalcular sugerencias';
      }
    });
  }

  onStep2Back(): void {
    this.step = 1;
  }

  private buildRowDecisions(result: SharedEventImportParseResult): void {
    this.rowDecisions = result.rows.map(row => ({
      row,
      action: row.unsupported ? 'Skip' : 'CreateNew',
      selectedMatchKey: '',
      paymentMode: 'account',
      accountId: '',
      cardId: '',
      installments: 1,
      firstInstallment: ''
    }));
  }

  // ── Paso 3 ──────────────────────────────────────────────────────────────

  applyDefaultAccountToAll(): void {
    if (!this.defaultAccountId) return;
    this.rowDecisions.forEach(d => {
      if (d.action !== 'Skip' && this.rowNeedsPayment(d)) {
        d.paymentMode = 'account';
        d.accountId = this.defaultAccountId;
      }
    });
  }

  // true si esta fila involucra la propia plata del usuario (la pagó él, o es una de las dos
  // partes de un pago) y por lo tanto necesita indicar cómo se pagó (cuenta o tarjeta)
  rowNeedsPayment(d: RowDecisionRow): boolean {
    if (d.action === 'LinkExisting') return false;
    if (d.row.isPayment) {
      const fromIsMe = d.row.payerMemberName === this.currentUserMemberName;
      const toIsMe = d.row.receiverMemberName === this.currentUserMemberName;
      return fromIsMe || toIsMe;
    }
    return d.row.payerMemberName === this.currentUserMemberName;
  }

  // los pagos (a diferencia de los gastos) solo soportan cuenta, nunca tarjeta
  rowSupportsCard(d: RowDecisionRow): boolean {
    return !d.row.isPayment;
  }

  onSelectedMatchChange(d: RowDecisionRow): void {
    if (d.selectedMatchKey) {
      d.action = 'LinkExisting';
    } else if (d.action === 'LinkExisting') {
      d.action = 'CreateNew';
    }
  }

  get step3Valid(): boolean {
    return this.rowDecisions.every(d => {
      if (d.action === 'Skip') return true;
      if (d.action === 'LinkExisting') return !!d.selectedMatchKey;
      if (!this.rowNeedsPayment(d)) return true;
      if (d.paymentMode === 'account') return !!d.accountId;
      return !!d.cardId && d.installments > 0 && !!d.firstInstallment;
    });
  }

  get pendingRowsCount(): number {
    return this.rowDecisions.filter(d => d.action !== 'Skip').length;
  }

  onStep3Back(): void {
    this.step = 2;
  }

  onStep3Confirm(): void {
    if (!this.step3Valid) return;
    this.errorMessage = '';
    this.isLoading = true;

    const memberMappings: SharedEventImportMemberMapping[] = this.memberMappings.map(m => ({
      memberName: m.name,
      isCurrentUser: m.mode === 'me',
      personId: m.mode === 'existing' ? Number(m.personId) : undefined,
      newPersonName: m.mode === 'new' ? m.newPersonName : undefined
    }));

    const categoryMappings: SharedEventImportCategoryMapping[] = this.categoryMappings.map(c => ({
      categoryName: c.name,
      transactionClassId: c.mode === 'existing' ? Number(c.transactionClassId) : undefined,
      newCategoryName: c.mode === 'new' ? c.newCategoryName : undefined
    }));

    const rowDecisions: SharedEventImportRowDecision[] = this.rowDecisions.map(d => {
      const decision: SharedEventImportRowDecision = { rowIndex: d.row.rowIndex, action: d.action };
      if (d.action === 'LinkExisting' && d.selectedMatchKey) {
        const [kind, id] = d.selectedMatchKey.split(':');
        if (kind === 'tx') decision.transactionId = Number(id);
        else decision.cardTransactionId = Number(id);
      }
      if (d.action === 'CreateNew' && this.rowNeedsPayment(d)) {
        if (d.paymentMode === 'account') {
          decision.accountId = Number(d.accountId);
        } else {
          decision.cardId = Number(d.cardId);
          decision.installments = d.installments;
          decision.firstInstallment = d.firstInstallment + '-01';
        }
      }
      return decision;
    });

    this.sharedEventService.confirmImport(Number(this.selectedEventId), {
      csvContent: this.csvContent,
      memberMappings,
      categoryMappings,
      rowDecisions
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.confirmResult = result;
        this.step = 4;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message ?? 'Error al confirmar la importación';
      }
    });
  }

  // ── Paso 4 ──────────────────────────────────────────────────────────────

  goToEvent(): void {
    this.router.navigate(['/shared-events', this.selectedEventId]);
  }
}
