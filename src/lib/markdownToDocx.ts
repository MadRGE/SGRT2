import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';

interface ParsedLine {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'checkbox' | 'table-row' | 'separator' | 'empty';
  content: string;
  cells?: string[];
  checked?: boolean;
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim();

  if (!trimmed) return { type: 'empty', content: '' };
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') return { type: 'separator', content: '' };
  if (trimmed.startsWith('### ')) return { type: 'h3', content: trimmed.slice(4) };
  if (trimmed.startsWith('## ')) return { type: 'h2', content: trimmed.slice(3) };
  if (trimmed.startsWith('# ')) return { type: 'h1', content: trimmed.slice(2) };
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    // Skip separator rows like |---|---|
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) return { type: 'separator', content: '' };
    const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
    return { type: 'table-row', content: trimmed, cells };
  }
  if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
    return { type: 'checkbox', content: trimmed.slice(6), checked: true };
  }
  if (trimmed.startsWith('- [ ] ')) {
    return { type: 'checkbox', content: trimmed.slice(6), checked: false };
  }
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return { type: 'list', content: trimmed.slice(2) };
  }

  return { type: 'paragraph', content: trimmed };
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match **bold**, *italic*, and plain text
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // Bold
      runs.push(new TextRun({ text: match[2], bold: true, font: 'Calibri', size: 22 }));
    } else if (match[3]) {
      // Italic
      runs.push(new TextRun({ text: match[3], italics: true, font: 'Calibri', size: 22 }));
    } else if (match[4]) {
      // Plain
      runs.push(new TextRun({ text: match[4], font: 'Calibri', size: 22 }));
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, font: 'Calibri', size: 22 }));
  }

  return runs;
}

function createTableFromRows(rows: string[][]): Table {
  const isHeader = rows.length > 0;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((cells, rowIndex) =>
      new TableRow({
        children: cells.map(cell =>
          new TableCell({
            width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: rowIndex === 0 && isHeader,
                    font: 'Calibri',
                    size: 20,
                  }),
                ],
                spacing: { before: 40, after: 40 },
              }),
            ],
          })
        ),
      })
    ),
  });
}

export function markdownToDocx(markdown: string, title: string): Document {
  const lines = markdown.split('\n');
  const parsed = lines.map(parseLine);
  const children: (Paragraph | Table)[] = [];

  let i = 0;
  while (i < parsed.length) {
    const line = parsed[i];

    switch (line.type) {
      case 'h1':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(line.content),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
        break;

      case 'h2':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(line.content),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case 'h3':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(line.content),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
        break;

      case 'table-row': {
        // Collect all consecutive table rows
        const tableRows: string[][] = [];
        while (i < parsed.length && (parsed[i].type === 'table-row' || parsed[i].type === 'separator')) {
          if (parsed[i].type === 'table-row' && parsed[i].cells) {
            tableRows.push(parsed[i].cells!);
          }
          i++;
        }
        if (tableRows.length > 0) {
          children.push(createTableFromRows(tableRows));
        }
        continue; // Skip i++ at the end
      }

      case 'list':
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '•  ', font: 'Calibri', size: 22 }),
              ...parseInlineFormatting(line.content),
            ],
            spacing: { before: 40, after: 40 },
            indent: { left: 360 },
          })
        );
        break;

      case 'checkbox':
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: line.checked ? '☑  ' : '☐  ', font: 'Calibri', size: 22 }),
              ...parseInlineFormatting(line.content),
            ],
            spacing: { before: 40, after: 40 },
            indent: { left: 360 },
          })
        );
        break;

      case 'paragraph':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(line.content),
            spacing: { before: 80, after: 80 },
          })
        );
        break;

      case 'separator':
        children.push(
          new Paragraph({
            children: [],
            spacing: { before: 120, after: 120 },
          })
        );
        break;

      case 'empty':
        // Skip consecutive empty lines
        break;
    }

    i++;
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });
}

export async function downloadDocx(markdown: string, filename: string): Promise<void> {
  const doc = markdownToDocx(markdown, filename);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
