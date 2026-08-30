import { Component, OnInit, AfterViewInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TransactionService } from '../../transaction/services/transaction.service';
import { UserService } from '../../user/services/user.service';
import { CardTransactionsService } from '../../cardTransactions/services/card-transactions.service';
import { ReportService } from '../../report/services/report.service';
import { HomeStatsDTO } from '../../report/models/HomeStats.model';
import type { EChartsOption } from 'echarts';
import { Transaction } from '../../transaction/models/transaction.model';
import { CardTransactionPending } from '../../cardTransactions/models/cardTransactions-pending.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { SharedEventService } from '../../shared-events/services/shared-event.service';
import { SharedEventActiveSummary } from '../../shared-events/models/shared-event.model';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardDueStatus, getCardDueStatus } from '../../card/utils/card-due-status.util';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, SlicePipe, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';

interface ConsolidatedTotal {
  assetId: number;
  assetSymbol: string;
  net: number;
}

interface CardWithDueStatus extends Card {
  dueStatus: CardDueStatus;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgClass, NgSwitch, NgSwitchCase, SlicePipe, DecimalPipe, DatePipe, CurrencyFiatFormatPipe, ChartComponent]
})
export class HomeComponent implements OnInit, AfterViewInit {
  isLoading: boolean = true;
  transactions: Transaction[] = [];
  cardTransactions: CardTransactionPending[] = [];
  userName: string = '';
  stocksChartOptions: EChartsOption = {};
  cryptosChartOptions: EChartsOption = {};
  mainReference: Asset | null = null;
  activeSummaries: SharedEventActiveSummary[] = [];
  consolidatedTotals: ConsolidatedTotal[] = [];
  cardsWithDueAlert: CardWithDueStatus[] = [];

  constructor(
    private transactionService: TransactionService,
    private userService: UserService,
    private cardTransactioneService: CardTransactionsService,
    private reportService: ReportService,
    private assetService: AssetService,
    private sharedEventService: SharedEventService,
    private cardService: CardService,
    private toastService: ToastService,
    private chartTheme: ChartThemeService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Los gráficos se renderizarán después de que el DOM esté listo
  }

  loadData() {
    forkJoin({
      userData: this.userService.getUserData(),
      transactionsData: this.transactionService.getTransactions(1, 6),
      cardTransactionsData: this.cardTransactioneService.getPendingCardTransactions(),
      homeStatsData: this.reportService.getHomeStats(),
      activeSummaryData: this.sharedEventService.getActiveSummary(),
      consolidatedDebtsData: this.sharedEventService.getConsolidatedDebts(),
      cardsData: this.cardService.getAllCards()
    }).subscribe({
      next: ({ userData, transactionsData, cardTransactionsData, homeStatsData, activeSummaryData, consolidatedDebtsData, cardsData }) => {
        this.userName = userData.name;
        this.transactions = transactionsData.transactions;
        this.cardTransactions = cardTransactionsData.reverse();
        this.activeSummaries = activeSummaryData;
        this.consolidatedTotals = this.computeConsolidatedTotals(consolidatedDebtsData);
        this.cardsWithDueAlert = cardsData
          .map(card => ({ ...card, dueStatus: getCardDueStatus(card) }))
          .filter(card => card.dueStatus === 'alerta' || card.dueStatus === 'vencido');
        setTimeout(() => {
          this.loadMainReferences(homeStatsData);

        });
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
        this.isLoading = false;
        this.toastService.error('Error al cargar los datos del inicio');
      }
    });
  }

  private computeConsolidatedTotals(debts: { assetId: number; assetSymbol: string; pendingInFavor: number; pendingAgainst: number }[]): ConsolidatedTotal[] {
    const totals = new Map<number, ConsolidatedTotal>();
    for (const d of debts) {
      const existing = totals.get(d.assetId);
      const net = d.pendingInFavor - d.pendingAgainst;
      if (existing) {
        existing.net += net;
      } else {
        totals.set(d.assetId, { assetId: d.assetId, assetSymbol: d.assetSymbol, net });
      }
    }
    return Array.from(totals.values()).filter(t => Math.abs(t.net) > 0.01);
  }

  loadMainReferences(homeStatsData: HomeStatsDTO) {
    // Cargar las referencias 
    const stocksRef = this.assetService.getReferenceAssets().subscribe((data: any) => {
            
          //check for the mainReference asset
          this.mainReference = data.find((x: Asset) => x.isMainReference);
          this.renderHomeGraphs(homeStatsData); // Asegurarse de que el DOM esté listo
        });
  }
  
  renderHomeGraphs(data: HomeStatsDTO) {
    const assetTypes = data.stockStatsGral.map(x => x.assetType);
    const stocksCurrentValues = data.stockStatsGral.map(x => x.actualValue);
    this.stocksChartOptions = this.chartTheme.pieOptions(assetTypes, stocksCurrentValues, {
      title: 'Distribución por Tipo de Activo (En ' + this.mainReference?.name + ')',
    });

    const cryptoAssets = data.cryptoStatsGral.map(x => x.assetName);
    const cryptosCurrentValues = data.cryptoStatsGral.map(x => x.actualValue);
    this.cryptosChartOptions = this.chartTheme.pieOptions(cryptoAssets, cryptosCurrentValues, {
      title: 'Distribución por Criptomoneda (En ' + this.mainReference?.name + ')',
    });
  }
}
