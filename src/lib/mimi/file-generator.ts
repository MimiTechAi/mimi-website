/**
 * MIMI Agent - File Generator
 * Phase 11.2: Dokumente erstellen und herunterladen
 * 
 * Generiert PDF, Word, und andere Dateien client-seitig
 */

// jsPDF wird dynamisch importiert um SSR zu vermeiden

export interface FileGeneratorOptions {
    title?: string;
    author?: string;
    margins?: { top: number; right: number; bottom: number; left: number };
}

/**
 * Generiert PDF aus Text/Markdown
 */
export async function generatePDF(
    content: string,
    filename: string,
    options?: FileGeneratorOptions
): Promise<Blob> {
    // Dynamischer Import
    const jsPDF = (await import('jspdf')).default;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const margins = options?.margins || { top: 20, right: 20, bottom: 20, left: 20 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margins.left - margins.right;

    // Titel
    if (options?.title) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(options.title, margins.left, margins.top);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
    }

    // Content parsen und formatieren
    const lines = content.split('\n');
    let y = options?.title ? margins.top + 15 : margins.top;

    for (const line of lines) {
        // Neue Seite wenn nötig
        if (y > pageHeight - margins.bottom) {
            doc.addPage();
            y = margins.top;
        }

        // Markdown-ähnliche Formatierung
        if (line.startsWith('# ')) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(2), margins.left, y);
            y += 8;
        } else if (line.startsWith('## ')) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(3), margins.left, y);
            y += 7;
        } else if (line.startsWith('### ')) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(4), margins.left, y);
            y += 6;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('• ' + line.substring(2), margins.left + 5, y);
            y += 5;
        } else if (line.trim() === '') {
            y += 3;
        } else {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');

            // Text umbrechen
            const splitText = doc.splitTextToSize(line, maxWidth);
            for (const textLine of splitText as string[]) {
                if (y > pageHeight - margins.bottom) {
                    doc.addPage();
                    y = margins.top;
                }
                doc.text(textLine, margins.left, y);
                y += 5;
            }
        }
    }

    // Autor/Footer
    if (options?.author) {
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text(
            `Erstellt von ${options.author}`,
            margins.left,
            pageHeight - 10
        );
    }

    return doc.output('blob');
}

/**
 * Generiert Markdown-Datei
 */
export function generateMarkdown(
    content: string,
    filename: string,
    options?: FileGeneratorOptions
): Blob {
    let markdown = content;

    if (options?.title) {
        markdown = `# ${options.title}\n\n${content}`;
    }

    if (options?.author) {
        markdown += `\n\n---\n*Erstellt von ${options.author}*`;
    }

    return new Blob([markdown], { type: 'text/markdown' });
}

/**
 * Generiert Plain Text
 */
export function generateText(content: string, filename: string): Blob {
    return new Blob([content], { type: 'text/plain' });
}

/**
 * Generiert JSON
 */
export function generateJSON(
    data: unknown,
    filename: string,
    pretty = true
): Blob {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    return new Blob([json], { type: 'application/json' });
}

/**
 * Generiert CSV aus Daten
 */
export function generateCSV(
    data: Record<string, unknown>[],
    filename: string
): Blob {
    if (data.length === 0) {
        return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return String(val ?? '');
        }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv' });
}

/**
 * Generiert Excel (.xlsx) aus Daten
 */
export async function generateExcel(
    data: Record<string, unknown>[],
    filename: string,
    options?: FileGeneratorOptions
): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    workbook.creator = options?.author || 'MIMI Agent';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(options?.title || 'Daten');

    if (data.length > 0) {
        // Headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Header Styling
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
        };
        headerRow.font = { color: { argb: 'FFFFFF' }, bold: true };

        // Data Rows
        for (const row of data) {
            worksheet.addRow(headers.map(h => row[h]));
        }

        // Auto-width columns
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
}

/**
 * Generiert Word (.docx) aus Text/Markdown
 */
export async function generateWord(
    content: string,
    filename: string,
    options?: FileGeneratorOptions
): Promise<Blob> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paragraphs: any[] = [];

    // Titel
    if (options?.title) {
        paragraphs.push(
            new Paragraph({
                text: options.title,
                heading: HeadingLevel.TITLE
            })
        );
    }

    // Content parsen
    const lines = content.split('\n');

    for (const line of lines) {
        if (line.startsWith('# ')) {
            paragraphs.push(
                new Paragraph({
                    text: line.substring(2),
                    heading: HeadingLevel.HEADING_1
                })
            );
        } else if (line.startsWith('## ')) {
            paragraphs.push(
                new Paragraph({
                    text: line.substring(3),
                    heading: HeadingLevel.HEADING_2
                })
            );
        } else if (line.startsWith('### ')) {
            paragraphs.push(
                new Paragraph({
                    text: line.substring(4),
                    heading: HeadingLevel.HEADING_3
                })
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            paragraphs.push(
                new Paragraph({
                    text: line.substring(2),
                    bullet: { level: 0 }
                })
            );
        } else if (line.trim() !== '') {
            // Fett/Kursiv parsen
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const runs: any[] = [];
            let text = line;

            // Einfache Bold/Italic Erkennung
            const boldMatch = text.match(/\*\*(.*?)\*\*/g);
            if (boldMatch) {
                for (const match of boldMatch) {
                    const boldText = match.replace(/\*\*/g, '');
                    text = text.replace(match, boldText);
                    runs.push(new TextRun({ text: boldText, bold: true }));
                }
            } else {
                runs.push(new TextRun(text));
            }

            paragraphs.push(new Paragraph({ children: runs }));
        } else {
            paragraphs.push(new Paragraph({}));
        }
    }

    // Footer mit Autor
    if (options?.author) {
        paragraphs.push(new Paragraph({}));
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Erstellt von ${options.author}`,
                        italics: true,
                        size: 20
                    })
                ]
            })
        );
    }

    const doc = new Document({
        creator: options?.author || 'MIMI Agent',
        title: options?.title || filename,
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}

/**
 * Lädt Datei herunter
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generiert und lädt Datei basierend auf Typ
 */
export async function generateAndDownload(
    content: string,
    filename: string,
    type: 'pdf' | 'markdown' | 'text' | 'json' | 'csv' | 'excel' | 'word',
    options?: FileGeneratorOptions
): Promise<void> {
    let blob: Blob;
    let extension: string;

    switch (type) {
        case 'pdf':
            blob = await generatePDF(content, filename, options);
            extension = '.pdf';
            break;
        case 'markdown':
            blob = generateMarkdown(content, filename, options);
            extension = '.md';
            break;
        case 'json':
            blob = generateJSON(JSON.parse(content), filename);
            extension = '.json';
            break;
        case 'csv':
            blob = generateCSV(JSON.parse(content), filename);
            extension = '.csv';
            break;
        case 'excel':
            blob = await generateExcel(JSON.parse(content), filename, options);
            extension = '.xlsx';
            break;
        case 'word':
            blob = await generateWord(content, filename, options);
            extension = '.docx';
            break;
        default:
            blob = generateText(content, filename);
            extension = '.txt';
    }

    const finalFilename = filename.endsWith(extension) ? filename : filename + extension;
    downloadFile(blob, finalFilename);
}
