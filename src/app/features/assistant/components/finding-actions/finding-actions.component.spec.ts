import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FindingActionsComponent } from './finding-actions.component';
import { AssistantService } from '../../services/assistant.service';
import { AssistantFinding } from '../../models/assistant.model';
import { ToastService } from '../../../../core/services/toast.service';

// plan-devoluciones-llm.md, Fase 12 — descartar y calificar un hallazgo desde la bandeja de Inicio y Panorama.
describe('FindingActionsComponent', () => {
    let fixture: ComponentFixture<FindingActionsComponent>;
    let component: FindingActionsComponent;
    let service: jasmine.SpyObj<AssistantService>;
    let toast: jasmine.SpyObj<ToastService>;

    const updated: AssistantFinding = {
        id: 10, reviewId: 1, title: 't', detail: 'd', transactionClassId: null, status: 'Active', expiresAt: '2026-10-31T00:00:00',
        rating: null, unverifiedFigures: [], createdAt: '2026-10-17T00:00:00'
    };

    function buttons(): HTMLButtonElement[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    }

    beforeEach(() => {
        service = jasmine.createSpyObj<AssistantService>('AssistantService', ['updateFinding']);
        service.updateFinding.and.returnValue(of(updated));
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['error']);
        TestBed.configureTestingModule({
            imports: [FindingActionsComponent],
            providers: [
                { provide: AssistantService, useValue: service },
                { provide: ToastService, useValue: toast },
                provideRouter([])
            ]
        });
        fixture = TestBed.createComponent(FindingActionsComponent);
        component = fixture.componentInstance;
        component.findingId = 10;
        fixture.detectChanges();
    });

    it('rates the finding as useful and marks the button', () => {
        buttons()[0].click();
        fixture.detectChanges();

        expect(service.updateFinding).toHaveBeenCalledOnceWith(10, { rating: 1 });
        expect(component.rating).toBe(1);
        expect(buttons()[0].classList).toContain('btn-success');
    });

    it('rates the finding as not useful', () => {
        buttons()[1].click();

        expect(service.updateFinding).toHaveBeenCalledOnceWith(10, { rating: -1 });
        expect(component.rating).toBe(-1);
    });

    it('does nothing when the same rating is tapped again', () => {
        buttons()[0].click();
        buttons()[0].click();

        expect(service.updateFinding).toHaveBeenCalledTimes(1);
    });

    it('lets the rating change from useful to not useful', () => {
        buttons()[0].click();
        buttons()[1].click();

        expect(service.updateFinding.calls.allArgs().map(a => a[1])).toEqual([{ rating: 1 }, { rating: -1 }]);
        expect(component.rating).toBe(-1);
    });

    it('dismisses the finding and tells the screen to take it out of the list', () => {
        const dismissed: number[] = [];
        component.dismissed.subscribe(id => dismissed.push(id));

        buttons()[2].click();

        expect(service.updateFinding).toHaveBeenCalledOnceWith(10, { dismiss: true });
        expect(dismissed).toEqual([10]);
    });

    it('keeps the finding and shows the backend message when dismissing fails', () => {
        service.updateFinding.and.returnValue(throwError(() => ({ error: { message: 'El hallazgo ya venció.' } })));
        const dismissed: number[] = [];
        component.dismissed.subscribe(id => dismissed.push(id));

        buttons()[2].click();

        expect(dismissed).toEqual([]);
        expect(toast.error).toHaveBeenCalledWith('El hallazgo ya venció.');
        expect(component.busy).toBeFalse();
    });

    it('does not mark a rating that failed to save', () => {
        service.updateFinding.and.returnValue(throwError(() => new Error('boom')));

        buttons()[0].click();

        expect(component.rating).toBeNull();
        expect(toast.error).toHaveBeenCalledWith('No se pudo calificar el hallazgo.');
    });

    it('links to the findings tab of the assistant screen', () => {
        const link = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;

        expect(link.getAttribute('href')).toContain('/assistant');
        expect(link.getAttribute('href')).toContain('tab=findings');
    });
});
