import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { AssistantCardComponent, CARD_VARIANT_STORAGE_KEY } from './assistant-card.component';
import { AssistantService } from '../../services/assistant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AssistantFinding, AssistantLatest, AssistantReview, AssistantStatus } from '../../models/assistant.model';

// plan-devoluciones-llm-v2.md, Fase 9 — la tarjeta de Inicio ya no genera sola (las prepara el servicio de madrugada): estos tests
// cubren qué muestra con cada respuesta del backend, las tres variantes y los hallazgos de adentro, sin pegarle nunca a la API.
describe('AssistantCardComponent', () => {
    let fixture: ComponentFixture<AssistantCardComponent>;
    let component: AssistantCardComponent;
    let service: jasmine.SpyObj<AssistantService>;

    const enabled: AssistantStatus = { enabled: true, monthlyBudgetUsd: 3, spentUsd: 0.1, renewsOn: '2026-11-01T00:00:00', budgetReached: false };

    function review(overrides: Partial<AssistantReview> = {}): AssistantReview {
        return {
            id: 7, kind: 'MonthClose', periodStart: '2026-09-01T00:00:00', cutoffDate: '2026-09-30T00:00:00', status: 'Ready', isCurrent: true,
            purpose: 'User', headline: 'Septiembre cerró con ARS 2.284.215 de gasto', highlights: ['Gasto 8,9 % más que agosto', 'Patrimonio USD 17.019,22', 'Tres'],
            body: 'Cuerpo', unverifiedFigures: [], dataNotes: [], errorMessage: null, promptVersion: 'month-close.v2', model: 'claude-opus-5-5',
            createdAt: '2026-10-17T12:00:00', feedback: null, ...overrides
        };
    }

    function finding(id: number, title = 'Poco gasto en supermercado', detail = 'Casi no hubo gasto este mes.'): AssistantFinding {
        return { id, reviewId: 7, title, detail, transactionClassId: null, status: 'Active', expiresAt: '2026-11-01T00:00:00', rating: null, unverifiedFigures: [], createdAt: '2026-10-15T00:00:00' };
    }

    function latest(overrides: Partial<AssistantLatest> = {}): AssistantLatest {
        return { state: 'Ready', missingKind: null, missingPeriodStart: null, review: review(), weeklyScanDue: false, preparing: false, outlook: null, outlookNotes: [], ...overrides };
    }

    function missing(overrides: Partial<AssistantLatest> = {}): AssistantLatest {
        return latest({ state: 'NotGenerated', missingKind: 'MonthClose', missingPeriodStart: '2026-09-01T00:00:00', outlook: 'Scheduled', review: null, ...overrides });
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
        localStorage.removeItem(CARD_VARIANT_STORAGE_KEY);
        service = jasmine.createSpyObj<AssistantService>('AssistantService', ['getStatus', 'getLatest', 'generate', 'getFindings', 'updateFinding']);
        service.getStatus.and.returnValue(of(enabled));
        service.getLatest.and.returnValue(of(latest()));
        service.generate.and.returnValue(of(review()));
        service.getFindings.and.returnValue(of([]));
        TestBed.configureTestingModule({
            imports: [AssistantCardComponent],
            providers: [
                { provide: AssistantService, useValue: service },
                { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
                provideRouter([])
            ]
        });
    });

    afterEach(() => localStorage.removeItem(CARD_VARIANT_STORAGE_KEY));

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
    });

    it('stays hidden when the latest request fails and there is nothing to show', () => {
        service.getLatest.and.returnValue(throwError(() => new Error('boom')));
        create();

        expect(component.state).toBe('hidden');
    });

    it('does not show a card when there is nothing yet (periods without movements)', () => {
        service.getLatest.and.returnValue(of(latest({ state: 'Empty', review: null })));
        create();

        expect(component.state).toBe('hidden');
    });

    it('shows the headline, the three highlights and a link to read the whole review', () => {
        create();

        expect(component.state).toBe('visible');
        expect(text()).toContain('Septiembre cerró con ARS 2.284.215 de gasto');
        expect(text()).toContain('Cierre de septiembre 2026');
        expect(text()).toContain('Gasto 8,9 % más que agosto');
        const link = (fixture.nativeElement as HTMLElement).querySelector('a.btn') as HTMLAnchorElement;
        expect(link.textContent).toContain('Leer completa');
        expect(link.getAttribute('href')).toContain('review=7');
    });

    it('never generates anything by itself, not even the weekly scan', () => {
        service.getLatest.and.returnValue(of(latest({ weeklyScanDue: true })));
        create();

        expect(service.generate).not.toHaveBeenCalled();
    });

    it('warns when the review has figures to check', () => {
        service.getLatest.and.returnValue(of(latest({ review: review({ unverifiedFigures: ['ARS 85.000'] }) })));
        create();

        expect(text()).toContain('cifras a revisar');
    });

    it('says what the review was put together without', () => {
        service.getLatest.and.returnValue(of(latest({ review: review({ dataNotes: ['Falta la cotización del 30/09 de: GGAL.'] }) })));
        create();

        expect(text()).toContain('Armada sin');
        expect(text()).toContain('GGAL');
    });

    it('masks amounts written with the currency code, but not percentages', () => {
        fixture = TestBed.createComponent(AssistantCardComponent);
        component = fixture.componentInstance;
        component.hideAmounts = true;
        fixture.detectChanges();

        expect(text()).not.toContain('2.284.215');
        expect(text()).not.toContain('17.019,22');
        expect(text()).toContain('••••');
        expect(text()).toContain('8,9 %');
    });

    describe('when a review is missing (D7)', () => {
        it('says it is prepared tonight, keeps showing the last review and offers to generate it now', () => {
            service.getLatest.and.returnValue(of(missing({ review: review({ id: 5, kind: 'MidMonth', periodStart: '2026-08-01T00:00:00', headline: 'Agosto venía parejo' }) })));
            create();

            expect(component.state).toBe('visible');
            expect(text()).toContain('se prepara esta madrugada');
            expect(text()).toContain('Agosto venía parejo');
            expect(text()).toContain('Generar ahora');
            expect(service.generate).not.toHaveBeenCalled();
        });

        it('shows the notice even when there is no review yet', () => {
            service.getLatest.and.returnValue(of(missing()));
            create();

            expect(component.state).toBe('visible');
            expect(text()).toContain('La devolución de cierre de septiembre 2026 se prepara esta madrugada');
        });

        it('says the month is waiting for data and lists what is missing', () => {
            service.getLatest.and.returnValue(of(missing({ outlook: 'WaitingForData', outlookNotes: ['Falta registrar el cobro de AL30 del 09/09.'] })));
            create();

            expect(text()).toContain('espera a que el mes esté completo');
            expect(text()).toContain('AL30');
        });

        it('says when last night preparation failed', () => {
            service.getLatest.and.returnValue(of(missing({ outlook: 'LastRunFailed' })));
            create();

            expect(text()).toContain('falló');
            expect(text()).toContain('Generar ahora');
        });

        it('says when the automatic preparation did not run', () => {
            service.getLatest.and.returnValue(of(missing({ outlook: 'SchedulerNotRun' })));
            create();

            expect(text()).toContain('no corrió');
        });

        it('generates on demand with the kind and period the backend named, and then reloads', () => {
            service.getLatest.and.returnValues(of(missing()), of(latest()));
            create();

            component.generateNow();

            expect(service.generate).toHaveBeenCalledOnceWith({ kind: 'MonthClose', periodStart: '2026-09-01T00:00:00', regenerate: false });
            expect(component.review?.id).toBe(7);
            expect(component.notice).toBe('');
        });

        it('shows "Generando" while the request is in flight', () => {
            service.getLatest.and.returnValue(of(missing()));
            service.generate.and.returnValue(NEVER);
            create();

            component.generateNow();
            fixture.detectChanges();

            expect(component.generating).toBeTrue();
            expect(text()).toContain('Generando la devolución de cierre de septiembre 2026');
        });

        it('shows the reason when the generation comes back failed (cap reached, refusal...)', () => {
            service.getLatest.and.returnValue(of(missing()));
            service.generate.and.returnValue(of(review({ status: 'Failed', errorMessage: 'Se alcanzó el tope mensual de gasto del asistente.' })));
            create();

            component.generateNow();
            fixture.detectChanges();

            expect(text()).toContain('No se pudo generar la devolución de cierre de septiembre 2026');
            expect(text()).toContain('Se alcanzó el tope mensual');
        });

        it('shows the backend message when the request itself fails', () => {
            service.getLatest.and.returnValue(of(missing()));
            service.generate.and.returnValue(throwError(() => ({ error: { message: 'Ya se está generando esta devolución.' } })));
            create();

            component.generateNow();
            fixture.detectChanges();

            expect(text()).toContain('Ya se está generando esta devolución.');
        });
    });

    describe('while a review is being prepared', () => {
        it('shows it and asks again every few seconds until it is done', fakeAsync(() => {
            service.getLatest.and.returnValues(of(latest({ preparing: true })), of(latest({ preparing: true })), of(latest()));
            create();

            expect(component.preparing).toBeTrue();
            expect(text()).toContain('Preparando una devolución nueva');

            tick(AssistantCardComponent.PollMs);
            expect(service.getLatest).toHaveBeenCalledTimes(2);
            tick(AssistantCardComponent.PollMs);
            expect(service.getLatest).toHaveBeenCalledTimes(3);
            expect(component.preparing).toBeFalse();

            tick(AssistantCardComponent.PollMs * 3);
            expect(service.getLatest).toHaveBeenCalledTimes(3); // ya no pregunta
            discardPeriodicTasks();
        }));

        it('does not leave a timer behind when the card goes away', fakeAsync(() => {
            service.getLatest.and.returnValue(of(latest({ preparing: true })));
            create();

            fixture.destroy();
            tick(AssistantCardComponent.PollMs * 2);

            expect(service.getLatest).toHaveBeenCalledTimes(1);
        }));
    });

    describe('findings inside the card (D9)', () => {
        beforeEach(() => service.getFindings.and.returnValue(of([finding(10), finding(11, 'Delivery subió', 'Tercer mes seguido.')])));

        it('shows them under the points in the full variant, with their detail and buttons', () => {
            create();

            expect(text()).toContain('Poco gasto en supermercado');
            expect(text()).toContain('Casi no hubo gasto este mes.');
            expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-finding-actions').length).toBe(2);
        });

        it('takes a dismissed finding out of the list', () => {
            create();

            component.onFindingDismissed(10);
            fixture.detectChanges();

            expect(text()).not.toContain('Poco gasto en supermercado');
            expect(text()).toContain('Delivery subió');
        });

        it('masks the amounts of a finding when the amounts are hidden', () => {
            service.getFindings.and.returnValue(of([finding(10, 'Delivery', 'Llevás ARS 160.000 este mes.')]));
            fixture = TestBed.createComponent(AssistantCardComponent);
            component = fixture.componentInstance;
            component.hideAmounts = true;
            fixture.detectChanges();

            expect(text()).not.toContain('160.000');
        });

        it('keeps the card working when the findings request fails', () => {
            service.getFindings.and.returnValue(throwError(() => new Error('boom')));
            create();

            expect(component.state).toBe('visible');
            expect(component.findings).toEqual([]);
        });
    });

    describe('variants', () => {
        beforeEach(() => service.getFindings.and.returnValue(of([finding(10)])));

        it('starts in the full variant', () => {
            create();

            expect(component.variant).toBe('full');
            expect(text()).toContain('Gasto 8,9 % más que agosto');
        });

        it('compact: findings in view and the points folded behind a button', () => {
            create();
            component.setVariant('compact');
            fixture.detectChanges();

            expect(text()).toContain('Poco gasto en supermercado');
            expect(text()).not.toContain('Casi no hubo gasto este mes.');
            expect(text()).not.toContain('Gasto 8,9 % más que agosto');

            component.expanded = true;
            fixture.detectChanges();
            expect(text()).toContain('Gasto 8,9 % más que agosto');
        });

        it('points: the points in view and the findings folded behind a button', () => {
            create();
            component.setVariant('points');
            fixture.detectChanges();

            expect(text()).toContain('Gasto 8,9 % más que agosto');
            expect(text()).toContain('Hallazgos (1)');
            expect(text()).not.toContain('Poco gasto en supermercado');

            component.expanded = true;
            fixture.detectChanges();
            expect(text()).toContain('Poco gasto en supermercado');
        });

        it('remembers the choice', () => {
            create();
            component.setVariant('points');

            expect(localStorage.getItem(CARD_VARIANT_STORAGE_KEY)).toBe('points');

            fixture.destroy();
            create();
            expect(component.variant).toBe('points');
        });

        it('ignores a stored value it does not know', () => {
            localStorage.setItem(CARD_VARIANT_STORAGE_KEY, 'otra');
            create();

            expect(component.variant).toBe('full');
        });
    });
});
