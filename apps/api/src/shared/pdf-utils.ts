import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

/**
 * Build plain text with page markers so agents can cite Page N.
 */
function textWithPageMarkers(
  pages: Array<{ num: number; text: string }>,
  fallbackText: string,
): string {
  if (pages.length === 0) {
    return fallbackText.trim();
  }

  return pages
    .map((page) => {
      const body = page.text.trim();
      return `--- Page ${page.num} ---\n${body}`;
    })
    .join("\n\n")
    .trim();
}

/**
 * Extract plain text from a PDF on disk (with page markers).
 */
export async function extractPdfText(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return textWithPageMarkers(result.pages, result.text);
  } finally {
    await parser.destroy();
  }
}

/**
 * Extract plain text from a PDF buffer (with page markers).
 */
export async function extractPdfTextFromBuffer(
  data: Buffer | Uint8Array,
): Promise<string> {
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return textWithPageMarkers(result.pages, result.text);
  } finally {
    await parser.destroy();
  }
}
