// Parser para arquivos CSV e OFX de bancos brasileiros

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positivo = entrada, negativo = saída
  type: "INCOME" | "EXPENSE";
}

// ── OFX ─────────────────────────────────────────────────────────────────────

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Extrai blocos <STMTTRN>...</STMTTRN>
  const blocks = content.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi);
  if (!blocks) return [];

  for (const block of blocks) {
    const getValue = (tag: string): string => {
      // OFX pode ter <TAG>valor ou <TAG>valor\n
      const re = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
      const m = block.match(re);
      return m ? m[1].trim() : "";
    };

    const rawDate = getValue("DTPOSTED"); // 20260401 ou 20260401120000
    const rawAmount = getValue("TRNAMT");
    const memo = getValue("MEMO") || getValue("NAME") || "Sem descrição";

    if (!rawDate || !rawAmount) continue;

    const year = rawDate.slice(0, 4);
    const month = rawDate.slice(4, 6);
    const day = rawDate.slice(6, 8);
    const date = `${year}-${month}-${day}`;

    const amount = parseFloat(rawAmount.replace(",", "."));
    if (isNaN(amount)) continue;

    transactions.push({
      date,
      description: memo,
      amount: Math.abs(amount),
      type: amount >= 0 ? "EXPENSE" : "INCOME",
    });
  }

  return transactions;
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  // Conta ocorrências de delimitadores comuns
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  // Se tem ponto-e-vírgula, provavelmente é CSV brasileiro
  if (counts[";"] > 0) return ";";
  if (counts["\t"] > 0) return "\t";
  return ",";
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim().replace(/['"]/g, "");

  // DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  // YYYY/MM/DD
  const isoSlash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (isoSlash) {
    const [, y, m, d] = isoSlash;
    return `${y}-${m}-${d}`;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  let cleaned = raw.trim().replace(/['"]/g, "");

  // Remove R$ e espaços
  cleaned = cleaned.replace(/R\$\s*/gi, "").trim();

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Vírgula é decimal (brasileiro): 1.234,56 ou 20,00
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Ponto é decimal (americano): 1,234.56 ou 20.00
    cleaned = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
}

function detectColumns(headers: string[]): ColumnMap | null {
  const lower = headers.map((h) => h.toLowerCase().trim().replace(/['"]/g, ""));

  const dateIdx = lower.findIndex((h) =>
    /^(data|date|dt|dia|dtposted|data_transacao|data transação|data.transação)$/.test(h)
  );
  const descIdx = lower.findIndex((h) =>
    /^(descri[çc][aã]o|description|desc|memo|título|titulo|title|hist[oó]rico|historico|detalhe|lancamento|lançamento|estabelecimento)$/.test(h)
  );
  const amountIdx = lower.findIndex((h) =>
    /^(valor|amount|amt|value|quantia|montante|vl|val|total)$/.test(h)
  );

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return null;
  return { date: dateIdx, description: descIdx, amount: amountIdx };
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter);
  const colMap = detectColumns(headers);

  if (!colMap) return [];

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length <= Math.max(colMap.date, colMap.description, colMap.amount)) continue;

    const date = parseDate(cols[colMap.date]);
    const description = cols[colMap.description].trim().replace(/^["']|["']$/g, "");
    const amount = parseAmount(cols[colMap.amount]);

    if (!date || !description || amount === null) continue;

    transactions.push({
      date,
      description,
      amount: Math.abs(amount),
      type: amount >= 0 ? "EXPENSE" : "INCOME",
    });
  }

  return transactions;
}

// ── Detecção automática ─────────────────────────────────────────────────────

export function parseFile(content: string, filename: string): ParsedTransaction[] {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "ofx" || ext === "qfx") return parseOFX(content);
  return parseCSV(content);
}
