/**
 * Tiny PDF writer for the staff return receipt.
 *
 * Produces a single page PDF (one Helvetica text block per line) so the
 * "Download PDF" button hands the rider a real file instead of a placeholder.
 * Text is normalised to ASCII because the PDF content stream is byte counted.
 */

export interface ReceiptLine {
  label: string;
  value: string;
}

const toAscii = (value: string) =>
  value
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

/**
 * Build a one page PDF from a list of label/value pairs.
 *
 * @param title  Heading printed at the top of the page.
 * @param lines  Rows printed under the heading.
 */
export function buildReceiptPdf(title: string, lines: ReceiptLine[]): string {
  const content: string[] = [];

  content.push("BT");
  content.push("/F1 18 Tf");
  content.push("1 0 0 1 72 780 Tm");
  content.push(`(${toAscii(title)}) Tj`);
  content.push("ET");

  content.push("BT");
  content.push("/F1 11 Tf");
  let y = 740;
  for (const line of lines) {
    content.push(`1 0 0 1 72 ${y} Tm`);
    content.push(`(${toAscii(`${line.label}: ${line.value}`)}) Tj`);
    y -= 20;
  }
  content.push("ET");

  const stream = content.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

/** Trigger a browser download for the given text payload. */
export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType = "text/plain",
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
