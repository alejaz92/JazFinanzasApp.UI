import { Injectable, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';

export type PeriodPreset = 'this-month' | 'last-month' | 'last-12-months' | 'this-year' | 'last-year' | 'all' | 'custom';

export interface ReportPeriod {
    preset: PeriodPreset;
    // ISO "yyyy-MM-dd"; vacíos cuando preset === 'all'.
    from: string;
    to: string;
}

const STORAGE_KEY = 'report-context';

// Filtro de período y moneda único para toda la sección de Reportes (T4,
// docs/plans/activos/plan-rediseno-reportes.md): se elige una vez en la barra del shell y se
// mantiene al navegar entre reportes, en vez de que cada uno tenga su propio selector.
//
// Sincroniza con los query params (?period=...&from=...&to=...&currency=...) para que un link
// copiado reproduzca el mismo estado, y persiste la última selección en localStorage. Los
// presets con nombre (this-month, last-year, etc.) NO se congelan en la URL con su from/to
// resuelto — solo se guarda el preset, y el rango se recalcula contra "hoy" al cargar. Un
// período "custom" sí guarda from/to explícitos, porque ahí el rango es la elección del usuario.
@Injectable({ providedIn: 'root' })
export class ReportContextService {
    private readonly periodSignal = signal<ReportPeriod>(this.resolvePreset('this-month'));
    private readonly currencyAssetIdSignal = signal<number | null>(null);
    private readonly referenceAssetsSignal = signal<Asset[]>([]);

    readonly period = this.periodSignal.asReadonly();
    readonly currencyAssetId = this.currencyAssetIdSignal.asReadonly();
    readonly referenceAssets = this.referenceAssetsSignal.asReadonly();

    readonly currentCurrency = computed(() =>
        this.referenceAssetsSignal().find(a => a.id === this.currencyAssetIdSignal()) ?? null
    );

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly assetService: AssetService
    ) {
        this.restoreFromUrlOrStorage();
        this.loadReferenceAssets();
    }

    setPreset(preset: PeriodPreset): void {
        if (preset === 'custom') return;
        this.periodSignal.set(this.resolvePreset(preset));
        this.persist();
    }

    setCustomRange(from: string, to: string): void {
        if (!from || !to) return;
        this.periodSignal.set({ preset: 'custom', from, to });
        this.persist();
    }

    setCurrency(assetId: number): void {
        this.currencyAssetIdSignal.set(assetId);
        this.persist();
    }

    private loadReferenceAssets(): void {
        this.assetService.getReferenceAssets().subscribe(assets => {
            this.referenceAssetsSignal.set(assets);
            // Si no había moneda persistida/en la URL, arranca en la referencia principal del usuario.
            if (this.currencyAssetIdSignal() === null) {
                const mainReference = assets.find(a => a.isMainReference) ?? assets[0];
                if (mainReference) this.currencyAssetIdSignal.set(mainReference.id);
            }
        });
    }

    private restoreFromUrlOrStorage(): void {
        const params = this.route.snapshot.queryParams;
        const stored = this.readStorage();

        const preset = (params['period'] as PeriodPreset) ?? stored?.period.preset ?? 'this-month';
        if (preset === 'custom') {
            const from = params['from'] ?? stored?.period.from;
            const to = params['to'] ?? stored?.period.to;
            if (from && to) {
                this.periodSignal.set({ preset: 'custom', from, to });
            }
        } else {
            this.periodSignal.set(this.resolvePreset(preset));
        }

        const currencyParam = params['currency'] ? Number(params['currency']) : null;
        const currencyAssetId = currencyParam ?? stored?.currencyAssetId ?? null;
        if (currencyAssetId !== null) this.currencyAssetIdSignal.set(currencyAssetId);

        // Refleja el estado inicial en la URL (útil cuando vino de localStorage, no de query
        // params) diferido a la siguiente microtarea para no chocar con la navegación en curso.
        Promise.resolve().then(() => this.syncUrl());
    }

    private persist(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            period: this.periodSignal(),
            currencyAssetId: this.currencyAssetIdSignal()
        }));
        this.syncUrl();
    }

    private syncUrl(): void {
        const period = this.periodSignal();
        const queryParams: Record<string, string | null> = { period: period.preset };
        queryParams['from'] = period.preset === 'custom' ? period.from : null;
        queryParams['to'] = period.preset === 'custom' ? period.to : null;
        const currencyAssetId = this.currencyAssetIdSignal();
        queryParams['currency'] = currencyAssetId != null ? String(currencyAssetId) : null;

        void this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    private readStorage(): { period: ReportPeriod; currencyAssetId: number | null } | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    private resolvePreset(preset: PeriodPreset): ReportPeriod {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();

        switch (preset) {
            case 'last-month': {
                const first = new Date(y, m - 1, 1);
                const last = new Date(y, m, 0);
                return { preset, from: this.toIso(first), to: this.toIso(last) };
            }
            case 'last-12-months':
                return { preset, from: this.toIso(new Date(y, m - 11, 1)), to: this.toIso(today) };
            case 'this-year':
                return { preset, from: this.toIso(new Date(y, 0, 1)), to: this.toIso(today) };
            case 'last-year':
                return { preset, from: this.toIso(new Date(y - 1, 0, 1)), to: this.toIso(new Date(y - 1, 11, 31)) };
            case 'all':
                return { preset, from: '', to: '' };
            case 'this-month':
            default:
                return { preset: 'this-month', from: this.toIso(new Date(y, m, 1)), to: this.toIso(today) };
        }
    }

    private toIso(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
