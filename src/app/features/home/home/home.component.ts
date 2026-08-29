import { Component, OnInit } from '@angular/core';
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
import { NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, SlicePipe, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
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
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgClass, NgSwitch, NgSwitchCase, SlicePipe, DecimalPipe, DatePipe, ChartComponent, CurrencyFiatFormatPipe]
})
export class HomeComponent implements OnInit {
  isLoading: boolean = true;
  transactions: Transaction[] = [];
  cardTransactions: CardTransactionPending[] = [];
  userName: string = '';
  mainReference: Asset | null = null;
  activeSummaries: SharedEventActiveSummary[] = [];
  consolidatedTotals: ConsolidatedTotal[] = [];
  cardsWithDueAlert: CardWithDueStatus[] = [];

  stocksOptions: EChartsOption = {};
  cryptosOptions: EChartsOption = {};

  constructor(
    private transactionService: TransactionService,
    private userService: UserService,
    private cardTransactioneService: CardTransactionsService,
    private reportService: ReportService,
    private assetService: AssetService,
    private sharedEventService: SharedEventService,
    private cardService: CardService,
    private toastService: ToastService,
    private chartThemeService: ChartThemeService
  ) {}

  ngOnInit(): void {
    this.loadData();
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
        this.loadMainReferences(homeStatsData);
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
    this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
      this.mainReference = data.find((x: Asset) => x.isMainReference) ?? null;
      this.buildChartOptions(homeStatsData);
    });
  }

  private buildChartOptions(data: HomeStatsDTO): void {
    this.stocksOptions = this.buildPieOptions(
      data.stockStatsGral.map(x => ({ name: x.assetType, value: x.actualValue })),
      'Distribución por Tipo de Activo (En ' + this.mainReference?.name + ')'
    );
    this.cryptosOptions = this.buildPieOptions(
      data.cryptoStatsGral.map(x => ({ name: x.assetName, value: x.actualValue })),
      'Distribución por Criptomoneda (En ' + this.mainReference?.name + ')'
    );
  }

  private buildPieOptions(data: { name: string; value: number }[], title: string): EChartsOption {
    return {
      title: { text: title, left: 'center', textStyle: { fontSize: 14, color: this.chartThemeService.textColor } },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}: ${this.formatUsd(p.value)} (${p.percent}%)`;
        }
      },
      series: [{
        type: 'pie',
        top: 30,
        radius: ['45%', '70%'],
        data,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          formatter: (params) => {
            const p = params as { name: string; percent: number };
            return p.percent > 5 ? p.name : '';
          }
        }
      }]
    };
  }

  private formatUsd(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}
