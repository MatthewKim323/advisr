/**
 * Text chunking shared between /api/upload and scripts/seed-maria.mts.
 *
 * Paragraph-first, sentence-packed fallback for long paragraphs. Offsets are
 * byte-approximated from the original string so the UI can underline the
 * original passage when the student clicks a citation.
 *
 * Pure, synchronous, no deps — safe to import from either Node or Edge.
 */

export interface LocalChunk {
  text: string;
  offsetStart: number;
  offsetEnd: number;
}

export function chunkText(text: string, maxLen = 800): LocalChunk[] {
  const out: LocalChunk[] = [];
  const paras = text.split(/\n\s*\n/);
  let cursor = 0;
  for (const para of paras) {
    const start = text.indexOf(para, cursor);
    if (start < 0) continue;
    cursor = start + para.length;
    const trimmed = para.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length <= maxLen) {
      out.push({
        text: trimmed,
        offsetStart: start,
        offsetEnd: start + para.length,
      });
      continue;
    }
    // Long paragraph — break on sentence boundaries, keep each chunk
    // under `maxLen` while preserving approximate offsets.
    let cur = "";
    let curStart = start;
    let pos = start;
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (cur.length + s.length + 1 > maxLen && cur.length > 0) {
        out.push({ text: cur.trim(), offsetStart: curStart, offsetEnd: pos });
        cur = "";
        curStart = pos;
      }
      cur += (cur ? " " : "") + s;
      pos += s.length + 1;
    }
    if (cur.trim().length > 0) {
      out.push({ text: cur.trim(), offsetStart: curStart, offsetEnd: pos });
    }
  }
  return out;
}

/**
 * Extract plain text from a File. We keep this generous with MIME types —
 * anything text-like is readable directly; everything else falls back to the
 * raw bytes decoded as UTF-8 (good for .md, .txt, .csv, early-demo .docx-as-
 * text, etc.). Binary PDFs/DOCX are returned as-is and the Archivist worker
 * will likely extract nothing — by design, since real parsing belongs in a
 * dedicated service.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const mime = (file.type || "").toLowerCase();
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/csv" ||
    mime.endsWith("+json") ||
    mime.endsWith("+xml") ||
    file.name.toLowerCase().match(/\.(txt|md|csv|tsv|json|xml|yaml|yml|log)$/)
  ) {
    return await file.text();
  }
  // PDFs, images, audio — skip text. Archivist worker will see empty text
  // and emit zero claims; the file still lands in the manifest.
  return "";
}
