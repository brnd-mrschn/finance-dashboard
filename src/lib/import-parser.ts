// Parser para arquivos CSV e OFX de bancos brasileiros

/**
 * Lê um File como texto, detectando automaticamente o encoding.
 * Tenta UTF-8 primeiro; se encontrar caracteres de substituição (U+FFFD),
 * re-decodifica como Windows-1252 (comum em CSVs do Excel no Windows).
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      // Tenta UTF-8 primeiro
      const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      // Se não tem caracteres de substituição, UTF-8 está correto
      if (!utf8.includes("\uFFFD")) {
        resolve(utf8);
        return;
      }
      // Fallback: Windows-1252 (comum em CSVs do Excel no Windows)
      const win1252 = new TextDecoder("windows-1252", { fatal: false }).decode(buffer);
      resolve(win1252);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

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

// ── Categorias CSV ─────────────────────────────────────────────────────────

export interface ParsedCategory {
  name: string;
  group: string;
  subgroup: string;
  type: "INCOME" | "EXPENSE";
}

interface CategoryColumnMap {
  name: number;
  group: number;
  subgroup: number;
  type: number;
}

function detectCategoryColumns(headers: string[]): CategoryColumnMap | null {
  const lower = headers.map((h) =>
    h.toLowerCase().trim().replace(/['"]/g, "").replace(/^\ufeff/, "")
  );

  // Correspondência flexível: usa includes/startsWith em vez de regex exato
  const nameIdx = lower.findIndex((h) =>
    /^(nome|name|categoria|category|cat|descri[çc][aã]o|description)$/.test(h) ||
    h.includes("nome") || h.includes("name") || h.includes("categoria")
  );
  const groupIdx = lower.findIndex((h) =>
    /^(grupo|group|grup|grp|g)$/.test(h) ||
    h.includes("grupo") || h.includes("group")
  );
  const subgroupIdx = lower.findIndex((h) =>
    /^(subgrupo|subgroup|subgrup|subgrp|subgrupo|sub|sg)$/.test(h) ||
    h.includes("subgrupo") || h.includes("subgroup") || h.includes("subgrupo")
  );
  const typeIdx = lower.findIndex((h) =>
    /^(tipo|type|tp|t|natureza)$/.test(h) ||
    h.includes("tipo") || h.includes("type")
  );

  if (nameIdx === -1 || groupIdx === -1 || subgroupIdx === -1 || typeIdx === -1) return null;
  return { name: nameIdx, group: groupIdx, subgroup: subgroupIdx, type: typeIdx };
}

function normalizeCategoryType(raw: string): "INCOME" | "EXPENSE" | null {
  const t = raw.trim().toLowerCase().replace(/['"]/g, "");
  if (/^(receita|entrada|income|in|crédito|credito|r|1)$/.test(t)) return "INCOME";
  if (/^(despesa|sa[ií]da|saida|expense|out|d[eé]bito|debito|d|2|e)$/.test(t)) return "EXPENSE";
  return null;
}

export function parseCategoryCSV(content: string): ParsedCategory[] {
  // Remove BOM (comum em CSVs exportados do Excel no Windows)
  const cleaned = content.replace(/^\ufeff/, "");

  const lines = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length < 1) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter);
  let colMap = detectCategoryColumns(headers);

  // Se não detectou cabeçalho, verifica se a primeira linha parece dados
  // Se sim, assume ordem: NOME, GRUPO, SUBGRUPO, TIPO (4 colunas)
  if (!colMap && headers.length >= 4) {
    // Verifica se a última coluna da primeira linha parece um tipo válido
    const lastCol = headers[headers.length - 1].trim().toLowerCase().replace(/['"]/g, "");
    if (normalizeCategoryType(lastCol) !== null) {
      // Primeira linha são dados, não cabeçalho — assume ordem fixa
      colMap = { name: 0, group: 1, subgroup: 2, type: 3 };
      // Processa a partir da linha 0 (inclui primeira linha como dados)
      const categories: ParsedCategory[] = [];
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(delimiter);
        if (cols.length < 4) continue;
        const name = cols[0].trim().replace(/^["']|["']$/g, "");
        const group = cols[1].trim().replace(/^["']|["']$/g, "");
        const subgroup = cols[2].trim().replace(/^["']|["']$/g, "");
        const type = normalizeCategoryType(cols[3]);
        if (!name || !group || !subgroup || !type) continue;
        categories.push({ name, group, subgroup, type });
      }
      return categories;
    }
  }

  if (!colMap) return [];

  const categories: ParsedCategory[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length <= Math.max(colMap.name, colMap.group, colMap.subgroup, colMap.type)) continue;

    const name = cols[colMap.name].trim().replace(/^["']|["']$/g, "");
    const group = cols[colMap.group].trim().replace(/^["']|["']$/g, "");
    const subgroup = cols[colMap.subgroup].trim().replace(/^["']|["']$/g, "");
    const type = normalizeCategoryType(cols[colMap.type]);

    if (!name || !group || !subgroup || !type) continue;

    categories.push({ name, group, subgroup, type });
  }

  return categories;
}
