import { formatDayMonth, formatUsd, maskMoney, parseInline, parseMarkdown, parseUtc, reviewKindLabel, reviewPeriodLabel, usagePercent } from './assistant.util';

describe('assistant.util', () => {

    describe('reviewPeriodLabel', () => {
        it('names the month of a close and of a mid-month review', () => {
            expect(reviewPeriodLabel('MonthClose', '2026-09-01T00:00:00')).toBe('Cierre de septiembre 2026');
            expect(reviewPeriodLabel('MidMonth', '2026-10-01T00:00:00')).toBe('Mitad de octubre 2026');
        });

        it('does not move the first day of the month to the previous month', () => {
            // El primer día del mes, sin zona horaria: un Date en UTC-3 lo correría a agosto.
            expect(reviewPeriodLabel('MonthClose', '2026-09-01')).toBe('Cierre de septiembre 2026');
        });

        it('labels the weekly scan with its day', () => {
            expect(reviewPeriodLabel('WeeklyScan', '2026-10-12T00:00:00')).toBe('Revisión semanal del 12/10');
        });
    });

    it('reviewKindLabel gives the filter names', () => {
        expect(reviewKindLabel('MonthClose')).toBe('Cierre de mes');
        expect(reviewKindLabel('MidMonth')).toBe('Mitad de mes');
    });

    it('formatDayMonth shows the cutoff as dd/MM', () => {
        expect(formatDayMonth('2026-10-16T00:00:00')).toBe('16/10');
    });

    describe('parseUtc', () => {
        it('reads an instant without a zone as UTC', () => {
            expect(parseUtc('2026-10-17T12:00:00').toISOString()).toBe('2026-10-17T12:00:00.000Z');
        });

        it('keeps an instant that already has a zone', () => {
            expect(parseUtc('2026-10-17T12:00:00Z').toISOString()).toBe('2026-10-17T12:00:00.000Z');
            expect(parseUtc('2026-10-17T12:00:00-03:00').toISOString()).toBe('2026-10-17T15:00:00.000Z');
        });
    });

    describe('parseInline', () => {
        it('splits bold and italic', () => {
            expect(parseInline('Total **$2.284.215** y *poco* más')).toEqual([
                { text: 'Total ', bold: false, italic: false },
                { text: '$2.284.215', bold: true, italic: false },
                { text: ' y ', bold: false, italic: false },
                { text: 'poco', bold: false, italic: true },
                { text: ' más', bold: false, italic: false }
            ]);
        });

        it('leaves unmatched asterisks as plain text', () => {
            expect(parseInline('5 * 3 y **sin cerrar')).toEqual([{ text: '5 * 3 y **sin cerrar', bold: false, italic: false }]);
        });
    });

    describe('parseMarkdown', () => {
        it('returns nothing for an empty text', () => {
            expect(parseMarkdown(null)).toEqual([]);
            expect(parseMarkdown('')).toEqual([]);
        });

        it('builds one paragraph per blank-line separated group and joins its lines', () => {
            const blocks = parseMarkdown('Primera línea\nsigue acá.\n\nOtro párrafo.');
            expect(blocks.length).toBe(2);
            expect(blocks[0]).toEqual({ type: 'paragraph', segments: [{ text: 'Primera línea sigue acá.', bold: false, italic: false }] });
        });

        it('builds bullet lists and keeps the bold inside the items', () => {
            const blocks = parseMarkdown('La suba se concentra en:\n\n- **Movilidad**: $357.845\n- **Delivery**: $119.037\n\nFin.');
            expect(blocks.map(b => b.type)).toEqual(['paragraph', 'list', 'paragraph']);
            const list = blocks[1] as Extract<typeof blocks[number], { type: 'list' }>;
            expect(list.ordered).toBeFalse();
            expect(list.items.length).toBe(2);
            expect(list.items[0][0]).toEqual({ text: 'Movilidad', bold: true, italic: false });
        });

        it('builds numbered lists', () => {
            const blocks = parseMarkdown('1. Uno\n2. Dos');
            expect(blocks).toEqual([{
                type: 'list', ordered: true,
                items: [[{ text: 'Uno', bold: false, italic: false }], [{ text: 'Dos', bold: false, italic: false }]]
            }]);
        });

        it('ends a list when a paragraph follows without a blank line', () => {
            const blocks = parseMarkdown('- Uno\n- Dos\nTexto suelto');
            expect(blocks.map(b => b.type)).toEqual(['list', 'paragraph']);
        });

        it('glues an indented continuation line to the previous item', () => {
            const blocks = parseMarkdown('- Un ítem largo\n  que sigue acá');
            const list = blocks[0] as Extract<typeof blocks[number], { type: 'list' }>;
            expect(list.items[0][0].text).toBe('Un ítem largo que sigue acá');
        });

        it('shows a heading as a bold paragraph instead of losing it', () => {
            expect(parseMarkdown('## Resumen')).toEqual([{ type: 'paragraph', segments: [{ text: 'Resumen', bold: true, italic: false }] }]);
        });

        it('does not treat an italic word at the start of a line as a bullet', () => {
            const blocks = parseMarkdown('*Septiembre* cerró con resultado negativo.');
            expect(blocks[0].type).toBe('paragraph');
        });

        it('keeps HTML as plain text, never as markup', () => {
            const blocks = parseMarkdown('Hola <script>alert(1)</script> **x**');
            const para = blocks[0] as Extract<typeof blocks[number], { type: 'paragraph' }>;
            expect(para.segments[0].text).toContain('<script>');
        });

        it('handles windows line endings', () => {
            expect(parseMarkdown('A\r\n\r\nB').length).toBe(2);
        });
    });

    describe('usagePercent', () => {
        it('rounds and clamps to 0-100', () => {
            expect(usagePercent(1.5, 3)).toBe(50);
            expect(usagePercent(4, 3)).toBe(100);
            expect(usagePercent(-1, 3)).toBe(0);
        });

        it('is zero without a budget', () => {
            expect(usagePercent(1, 0)).toBe(0);
        });
    });

    describe('maskMoney', () => {
        it('hides pesos and dollars amounts', () => {
            expect(maskMoney('Gasto de $2.284.215 y patrimonio de US$ 17.019,22.')).toBe('Gasto de •••• y patrimonio de ••••.');
        });

        it('keeps the final period of the sentence and leaves percentages and dates alone', () => {
            expect(maskMoney('Subió 8,9 % hasta $85.000. El 16/10 no pasó nada.')).toBe('Subió 8,9 % hasta ••••. El 16/10 no pasó nada.');
        });

        it('handles a minus sign and a small amount', () => {
            expect(maskMoney('Resultado de -$73.226 y $5')).toBe('Resultado de -•••• y ••••');
        });

        it('returns an empty text for null', () => {
            expect(maskMoney(null)).toBe('');
        });
    });

    it('formatUsd uses a decimal comma and thousands dots', () => {
        expect(formatUsd(1.25)).toBe('US$ 1,25');
        expect(formatUsd(1234.5)).toBe('US$ 1.234,50');
        expect(formatUsd(0)).toBe('US$ 0,00');
    });
});
