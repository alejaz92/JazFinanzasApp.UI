import { AssistantReviewKind } from '../models/assistant.model';

// plan-devoluciones-llm.md, Fase 11 — funciones puras de la pantalla del asistente.

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "Cierre de septiembre 2026" / "Mitad de octubre 2026". Se arma con el texto de la fecha y no con un Date: el
// backend manda el primer día del mes sin zona horaria y un Date lo podría correr al mes anterior.
export function reviewPeriodLabel(kind: AssistantReviewKind, periodStart: string): string {
    const month = Number(periodStart.slice(5, 7));
    const year = periodStart.slice(0, 4);
    const name = MONTHS[month - 1] ?? '';
    switch (kind) {
        case 'MonthClose': return `Cierre de ${name} ${year}`;
        case 'MidMonth': return `Mitad de ${name} ${year}`;
        default: return `Revisión semanal del ${formatDayMonth(periodStart)}`;
    }
}

export function reviewKindLabel(kind: AssistantReviewKind): string {
    switch (kind) {
        case 'MonthClose': return 'Cierre de mes';
        case 'MidMonth': return 'Mitad de mes';
        default: return 'Revisión semanal';
    }
}

// "16/10" a partir de "2026-10-16T00:00:00". Sin pasar por Date, por la misma razón de arriba.
export function formatDayMonth(date: string): string {
    return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

// El backend manda los instantes en UTC sin la "Z" (EF los lee sin zona): sin ella el navegador los tomaría como
// hora local y mostraría la generación con 3 horas de diferencia.
export function parseUtc(value: string): Date {
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
    return new Date(hasZone ? value : `${value}Z`);
}

// ── Markdown: el subconjunto que usan las instrucciones ───────────────────────────────────────────────────────
// Las instrucciones piden "dos a cinco párrafos cortos, y una lista con viñetas solo si ayuda; sin títulos
// grandes ni tablas". Se interpreta eso (párrafos, listas con viñetas o numeradas, **negrita** y *cursiva*) y
// nada más. No se arma HTML: el resultado son datos que el template pinta con interpolación, así que un texto
// del modelo con etiquetas HTML se ve como texto y nunca se ejecuta.

export interface MarkdownSegment {
    text: string;
    bold: boolean;
    italic: boolean;
}

export type MarkdownBlock =
    | { type: 'paragraph'; segments: MarkdownSegment[] }
    | { type: 'list'; ordered: boolean; items: MarkdownSegment[][] };

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
const LIST_ITEM = /^\s*(?:([-*•])|(\d+[.)]))\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

export function parseInline(text: string): MarkdownSegment[] {
    const segments: MarkdownSegment[] = [];
    for (const part of text.split(INLINE)) {
        if (!part) continue;
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            segments.push({ text: part.slice(2, -2), bold: true, italic: false });
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            segments.push({ text: part.slice(1, -1), bold: false, italic: true });
        } else {
            segments.push({ text: part, bold: false, italic: false });
        }
    }
    return segments;
}

export function parseMarkdown(markdown: string | null | undefined): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    if (!markdown) return blocks;

    let paragraph: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flushParagraph = () => {
        if (paragraph.length) {
            blocks.push({ type: 'paragraph', segments: parseInline(paragraph.join(' ')) });
            paragraph = [];
        }
    };
    const flushList = () => {
        if (list) {
            blocks.push({ type: 'list', ordered: list.ordered, items: list.items.map(parseInline) });
            list = null;
        }
    };

    for (const rawLine of markdown.replace(/\r\n/g, '\n').split('\n')) {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
            flushParagraph();
            flushList();
            continue;
        }

        const item = LIST_ITEM.exec(line);
        if (item) {
            flushParagraph();
            const ordered = item[2] !== undefined;
            if (list && list.ordered !== ordered) flushList();
            if (!list) list = { ordered, items: [] };
            list.items.push(item[3]);
            continue;
        }

        const heading = HEADING.exec(line);
        if (heading) {
            // Un título no se espera, pero si viene se muestra como un párrafo en negrita en vez de perderlo.
            flushParagraph();
            flushList();
            blocks.push({ type: 'paragraph', segments: [{ text: heading[1].trim(), bold: true, italic: false }] });
            continue;
        }

        // Una línea de continuación de un ítem de lista (sangrada) se pega al ítem anterior.
        if (list && /^\s{2,}\S/.test(rawLine)) {
            list.items[list.items.length - 1] += ' ' + line.trim();
            continue;
        }

        flushList();
        paragraph.push(line.trim());
    }
    flushParagraph();
    flushList();
    return blocks;
}

// Oculta los montos de un texto ("$85.000", "US$ 17.019,22") para el ojo de "ocultar montos" de Inicio: el texto
// de una devolución o de un hallazgo los trae escritos y no pasan por el formateo de la pantalla. Un punto o una
// coma al final de la frase no forman parte del monto.
const MONEY = /(?:US\$|u\$s|\$)\s?-?\d(?:[\d.,]*\d)?/gi;

export function maskMoney(text: string | null | undefined, mask = '••••'): string {
    return (text ?? '').replace(MONEY, mask);
}

// Porcentaje del tope gastado, acotado a 0-100 para la barra.
export function usagePercent(spentUsd: number, budgetUsd: number): number {
    if (!budgetUsd || budgetUsd <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((spentUsd / budgetUsd) * 100)));
}

// Dólares con coma decimal y punto de miles: "US$ 1,25".
export function formatUsd(value: number): string {
    const [whole, decimal] = Math.abs(value).toFixed(2).split('.');
    return `US$ ${value < 0 ? '-' : ''}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimal}`;
}
