import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { AssistantCardComponent } from './assistant-card.component';
import { AssistantService } from '../../services/assistant.service';
import { AssistantLatest, AssistantReview, AssistantStatus } from '../../models/assistant.model';

// plan-devoluciones-llm.md, Fase 12 — la tarjeta de Inicio es quien dispara la generación (D6): estos tests cubren
// qué hace con cada respuesta del backend, sin pegarle nunca a la API.
describe('AssistantCardComponent', () => {
    let fixture: ComponentFixture<AssistantCardComponent>;
    let component: AssistantCardComponent;
    let service: jasmine.SpyObj<AssistantService>;

    const enabled: AssistantStatus = { enabled: true, monthlyBudgetUsd: 3, spentUsd: 0.1, renewsOn: '2026-11-01T00:00:00', budgetReached: false };

    function review(overrides: Partial<AssistantReview> = {}): AssistantReview {
        return {
            id: 7, kind: 'MonthClose', periodStart: '2026-09-01T00:00:00', cutoffDate: '2026-09-30T00:00:00', status: 'Ready', isCurrent: true,
            purpose: 'User', headline: 'Septiembre cerró con $2.284.215 de gasto', highlights: ['Gasto 8,9 % más que agosto', 'Patrimonio US$ 17.019,22', 'Tres'],
            body: 'Cuerpo', unverifiedFigures: [], errorMessage: null, promptVersion: 'month-close.v1', model: 'claude-opus-5-5',
            createdAt: '2026-10-17T12:00:00', feedback: null, ...overrides
        };
    }

    function latest(overrides: Partial<AssistantLatest> = {}): AssistantLatest {
        return { state: 'Ready', missingKind: null, missingPeriodStart: null, review: review(), weeklyScanDue: false, ...overrides };
    }

    function create(): void {
        fixture = TestBed.createComponent(AssistantCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    function text(): string {
        return (fixture.nativeElement as HTMLElement).textContent ?? '';
    }

    beforeEach(() => {
        service = jasmine.createSpyObj<AssistantService>('AssistantService', ['getStatus', 'getLatest', 'generate']);
        service.getStatus.and.returnValue(of(enabled));
        service.getLatest.and.returnValue(of(latest()));
        service.generate.and.returnValue(of(review()));
        TestBed.configureTestingModule({
            imports: [AssistantCardComponent],
            providers: [{ provide: AssistantService, useValue: service }, provideRouter([])]
        });
    });

    it('does not show anything, and does not ask for the latest review, when the assistant is not enabled', () => {
        service.getStatus.and.returnValue(of({ ...enabled, enabled: false }));
        create();

        expect(component.state).toBe('hidden');
        expect(service.getLatest).not.toHaveBeenCalled();
        expect(text().trim()).toBe('');
    });

    it('stays hidden when the status request fails', () => {
        service.getStatus.and.returnValue(throwError(() => new Error('boom')));
        create();

        expect(component.state).toBe('hidden');
        expect(text().trim()).toBe('');
    });

    it('shows the headline, the three highlights and a link to read the whole review', () => {
        create();

        expect(component.state).toBe('ready');
        expect(text()).toContain('Septiembre cerró con $2.284.215 de gasto');
        expect(text()).toContain('Cierre de septiembre 2026');
        expect(text()).toContain('Gasto 8,9 % más que agosto');
        const link = (fixture.nativeElement as HTMLElement).querySelector('a.btn') as HTMLAnchorElement;
        expect(link.textContent).toContain('Leer completa');
        expect(link.getAttribute('href')).toContain('review=7');
        expect(service.generate).not.toHaveBeenCalled();
    });

    it('warns when the review has figures to check', () => {
        service.getLatest.and.returnValue(of(latest({ review: review({ unverifiedFigures: ['$85.000'] }) })));
        create();

        expect(text()).toContain('cifras a revisar');
    });

    it('masks the amounts of the text when the amounts are hidden, but not percentages', () => {
        fixture = TestBed.createComponent(AssistantCardComponent);
        component = fixture.componentInstance;
        component.hideAmounts = true;
        fixture.detectChanges();

        expect(text()).not.toContain('$2.284.215');
        expect(text()).not.toContain('17.019,22');
        expect(text()).toContain('••••');
        expect(text()).toContain('8,9 %');
    });

    it('does not show a card when there is nothing yet (periods without movements)', () => {
        service.getLatest.and.returnValue(of(latest({ state: 'Empty', review: null })));
        create();

        expect(component.state).toBe('hidden');
    });

    describe('generation (D6)', () => {
        it('asks for the missing review with the kind and period the backend named, and then shows it', () => {
            service.getLatest.and.returnValues(
                of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })),
                of(latest()));
            create();

            expect(service.generate).toHaveBeenCalledTimes(1);
            expect(service.generate).toHaveBeenCalledWith({ kind: 'MonthClose', periodStart: '2026-09-01T00:00:00', regenerate: false });
            expect(component.state).toBe('ready');
        });

        it('shows "Generando" while the request is in flight', () => {
            service.getLatest.and.returnValue(of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })));
            service.generate.and.returnValue(NEVER); // la llamada sigue en curso
            create();

            expect(component.state).toBe('generating');
            expect(text()).toContain('Generando la devolución de cierre de septiembre 2026');
        });

        it('generates the close and then the mid-month review when both are missing', () => {
            service.getLatest.and.returnValues(
                of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })),
                of(latest({ state: 'NotGenerated', missingKind: 'MidMonth', missingPeriodStart: '2026-10-01T00:00:00', review: null })),
                of(latest({ review: review({ id: 8, kind: 'MidMonth', periodStart: '2026-10-01T00:00:00' }) })));
            create();

            expect(service.generate.calls.allArgs().map(a => a[0].kind)).toEqual(['MonthClose', 'MidMonth']);
            expect(component.state).toBe('ready');
            expect(component.review?.id).toBe(8);
        });

        it('shows the reason when the generation comes back failed (cap reached, refusal...) and does not retry', () => {
            service.getLatest.and.returnValue(of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })));
            service.generate.and.returnValue(of(review({ status: 'Failed', errorMessage: 'Se alcanzó el tope mensual de gasto del asistente.' })));
            create();

            expect(component.state).toBe('failed');
            expect(text()).toContain('No se pudo generar la devolución de cierre de septiembre 2026');
            expect(text()).toContain('Se alcanzó el tope mensual');
            expect(service.generate).toHaveBeenCalledTimes(1);
        });

        it('shows the backend message when the request itself fails', () => {
            service.getLatest.and.returnValue(of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })));
            service.generate.and.returnValue(throwError(() => ({ error: { message: 'Ya se está generando esta devolución.' } })));
            create();

            expect(component.state).toBe('failed');
            expect(text()).toContain('Ya se está generando esta devolución.');
        });

        it('stops after three generations even if the backend keeps saying one is missing', () => {
            service.getLatest.and.returnValue(of(latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', review: null })));
            create();

            expect(service.generate).toHaveBeenCalledTimes(3);
            expect(component.state).toBe('hidden');
        });

        it('hides the card when the latest request fails and there is nothing to show', () => {
            service.getLatest.and.returnValue(throwError(() => new Error('boom')));
            create();

            expect(component.state).toBe('hidden');
        });
    });

    describe('weekly scan (D6, paso 3)', () => {
        it('fires it in the background, without any indicator, when the backend says it is due', () => {
            service.getLatest.and.returnValue(of(latest({ weeklyScanDue: true })));
            create();

            expect(service.generate).toHaveBeenCalledOnceWith({ kind: 'WeeklyScan', regenerate: false });
            expect(component.state).toBe('ready');
        });

        it('does not fire it when it is not due', () => {
            create();

            expect(service.generate).not.toHaveBeenCalled();
        });

        it('ignores its failure silently', () => {
            service.getLatest.and.returnValue(of(latest({ weeklyScanDue: true })));
            service.generate.and.returnValue(throwError(() => ({ error: { message: 'No hace falta una revisión semanal ahora' } })));
            create();

            expect(component.state).toBe('ready');
            expect(text()).not.toContain('No hace falta');
        });
    });
});
