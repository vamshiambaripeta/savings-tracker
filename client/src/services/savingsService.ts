import { API_BASE_URL, parseCurrency } from "../utils";
import {
  NetWorthDataResponse,
  NetWorthBreakdown,
  NetWorthRow,
  RothResponse,
  RothKpiData,
  RothRow,
  SavingsRow,
  SavingsEntry,
  APIResponse
} from "./types";

export const fetchNetWorthEntries = async (): Promise<NetWorthDataResponse> => {
  const response = await fetch(`${API_BASE_URL}/net-worth`);
  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch Net Worth data');
  }

  const rawRows: string[][] = result.data;
  if (rawRows.length === 0) {
    return {
      rows: [],
      summary: { cash: 0, iras: 0, total: 0 },
    };
  }

  // Parse Summary/Final Box (Top right: Columns Z & AA, Rows 2-4 -> Array indices 25 & 26)
  const summary: NetWorthBreakdown = {
    cash: parseCurrency(rawRows[1]?.[26]),
    iras: parseCurrency(rawRows[2]?.[26]),
    total: parseCurrency(rawRows[3]?.[26]),
  };

  let currentYear = 2025;
  const parsedRows: NetWorthRow[] = [];

  rawRows.forEach((row, index) => {
    const sheetRowNumber = index + 1;

    const colA = row[0] ? row[0].trim() : '';   // Column A: Month/Year label
    const colV = row[21] ? row[21].trim() : ''; // Column V: Month name (e.g., "January 2025", "February")
    const colW = row[22] ? row[22].trim() : ''; // Column W: Net Worth value

    // Track active year from Column V or Column A
    const yearMatch = (colV || colA).match(/\b(20\d{2})\b/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1], 10);
    }

    const netWorthVal = parseCurrency(colW);
    const dollarChg = parseCurrency(row[23]); // Column X: $ Change
    const percentChg = row[24]?.trim() || ''; // Column Y: % Change

    // Skip header rows or empty rows
    if (colV.toLowerCase().includes('monthly networth') || colA.toLowerCase().includes('monthly networth')) {
      return;
    }

    const monthLabel = colV || colA;
    const isEOY = colV.includes('EOY') || colA.includes('EOY') || (sheetRowNumber > 5 && !colV && netWorthVal > 0 && dollarChg !== 0);
    const hasBalances = netWorthVal !== 0 || dollarChg !== 0;

    if (!monthLabel && !hasBalances) return;

    const isFuture = !isEOY && !hasBalances;

    parsedRows.push({
      rowIndex: sheetRowNumber,
      year: currentYear,
      monthOrLabel: monthLabel,
      netWorth: netWorthVal,
      dollarChange: dollarChg,
      percentChange: percentChg,
      isEOYRow: isEOY,
      isFutureMonth: isFuture,
    });
  });

  return { rows: parsedRows, summary };
};

export const fetchRothEntries = async (): Promise<RothResponse> => {
  const response = await fetch(`${API_BASE_URL}/roth`);
  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch Roth IRA data');
  }

  const rawRows: string[][] = result.data;
  if (rawRows.length === 0) {
    return {
      kpis: {
        vamshiContributions: 0,
        priyaContributions: 0,
        totalContributions: 0,
        vamshiPnlDollar: 0,
        priyaPnlDollar: 0,
        totalPnlDollar: 0,
        vamshiPnlPercent: '0%',
        priyaPnlPercent: '0%',
        totalPnlPercent: '0%',
      },
      rows: [],
    };
  }

  // Parse KPI Block (Rows 2-4, Cols O:T -> Array indices 14:19)
  const kpis: RothKpiData = {
    vamshiContributions: parseCurrency(rawRows[1]?.[15]),
    priyaContributions: parseCurrency(rawRows[1]?.[16]),
    totalContributions: parseCurrency(rawRows[1]?.[19]),
    vamshiPnlDollar: parseCurrency(rawRows[2]?.[15]),
    priyaPnlDollar: parseCurrency(rawRows[2]?.[16]),
    totalPnlDollar: parseCurrency(rawRows[2]?.[19]),
    vamshiPnlPercent: rawRows[3]?.[15] || '0%',
    priyaPnlPercent: rawRows[3]?.[16] || '0%',
    totalPnlPercent: rawRows[3]?.[19] || '0%',
  };

  let currentYear = 2025;
  const parsedRows: RothRow[] = [];

  rawRows.forEach((row, index) => {
    const sheetRowNumber = index + 1;
    if (sheetRowNumber < 6) return; // Skip KPI header block

    const colA = row[0] ? row[0].trim() : '';   // Column A: Month name or Year marker
    const colO = row[14] ? row[14].trim() : ''; // Column O: "Contributions", "EoY balance:", or empty

    // Ignore manual update notes
    if (colA.toLowerCase().includes('manually updated') || colO.toLowerCase().includes('manually updated')) {
      return;
    }

    // Detect 4-digit active year in Column A
    if (/^\d{4}$/.test(colA)) {
      currentYear = parseInt(colA, 10);
    }

    // Replace lines 124-125:
    const isEoY = colO.toLowerCase().includes('eoy balance') || colA.toLowerCase().includes('eoy total');
    const isContrib = colO.toLowerCase().includes('contributions') || colA.toLowerCase().includes('contributions');

    // Prioritize Column O label if present ("Contributions", "EoY balance:"), otherwise use Column A month name
    const monthOrLabel = colO || colA;

    // Parse financial values (Cols P through T -> Array indices 15 through 19)
    const vamshiVal = parseCurrency(row[15]);
    const priyaVal = parseCurrency(row[16]);
    const dollarChg = parseCurrency(row[17]);
    const percentChg = row[18] || '';
    const rothBothVal = parseCurrency(row[19]);

    const hasBalances = vamshiVal !== 0 || priyaVal !== 0 || rothBothVal !== 0 || dollarChg !== 0;

    // Skip empty trailing rows
    if (!monthOrLabel && !hasBalances) return;

    const isFuture = !isEoY && !isContrib && !hasBalances;

    parsedRows.push({
      rowIndex: sheetRowNumber,
      year: currentYear,
      monthOrLabel: monthOrLabel,
      vamshiBalance: vamshiVal,
      priyaBalance: priyaVal,
      dollarChange: dollarChg,
      percentChange: percentChg,
      rothBoth: rothBothVal,
      isEoYRow: isEoY,
      isContributionsRow: isContrib,
      isFutureMonth: isFuture,
    });

    if (isEoY && /^\d{4}$/.test(colA)) {
      currentYear = parseInt(colA, 10) + 1;
    }
  });

  return { kpis, rows: parsedRows };
};

export const fetchSavingsEntries = async (): Promise<SavingsRow[]> => {
  const response = await fetch(`${API_BASE_URL}/savings`);
  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch savings data');
  }

  const rawRows: string[][] = result.data;
  if (rawRows.length === 0) return [];

  // Step 1: Read Row 1 to dynamically locate column indices by name
  const headerRow = rawRows[0].map((h) => h.trim());

  const getColIndex = (name: string): number =>
    headerRow.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  // Dynamic Index Mapping
  const idx = {
    savings: getColIndex('Savings'),
    vamshiBofa: getColIndex('Vamshi BoFA'),
    vamshiDcu: getColIndex('Vamshi DCU'),
    priyaBofa: getColIndex('Priya BoFA'),
    priyaEtrade: getColIndex('Priya E-Trade'),
    cash: getColIndex('Cash'),
    lcaBalance: getColIndex('LCA Balance'),
    ccDebt: getColIndex('CC Debt'),
    autoLoan: getColIndex('Auto Loan'),
    dollarChange: getColIndex('$ Change'),
    percentChange: getColIndex('% Change'),
    total: getColIndex('Total'),
  };

  let currentYear = 2025;
  const parsedRows: SavingsRow[] = [];

  // Step 2: Parse rows starting from Row 2 onward using named lookups
  rawRows.slice(1).forEach((row, index) => {
    const sheetRowNumber = index + 2; // +2 offset for 0-index + skipped header row
    const colA = row[0] ? row[0].trim() : '';
    const colB = row[1] ? row[1].trim() : '';

    if (!colA && !colB && !row[idx.total]) return;
    if (colB === 'Savings') return;

    const isEOY = colB === 'EOY Total';

    if (/^\d{4}$/.test(colA)) {
      currentYear = parseInt(colA, 10);
    }

    const totalVal = parseCurrency(row[idx.total]);

    // Check balance cells dynamically
    const hasBalances = row.slice(1, idx.dollarChange).some(
      (cell) => cell && cell.trim() !== '' && cell.trim() !== '-'
    );
    const isFuture = !isEOY && !hasBalances && totalVal === 0;

    parsedRows.push({
      rowIndex: sheetRowNumber,
      year: currentYear,
      monthOrLabel: isEOY ? 'EOY Total' : colA,
      savings: parseCurrency(row[idx.savings]),
      vamshiBofa: parseCurrency(row[idx.vamshiBofa]),
      vamshiDcu: parseCurrency(row[idx.vamshiDcu]),
      priyaBofa: parseCurrency(row[idx.priyaBofa]),
      priyaEtrade: parseCurrency(row[idx.priyaEtrade]),
      cash: parseCurrency(row[idx.cash]),
      lcaBalance: parseCurrency(row[idx.lcaBalance]),
      ccDebt: parseCurrency(row[idx.ccDebt]),
      autoLoan: parseCurrency(row[idx.autoLoan]),
      dollarChange: parseCurrency(row[idx.dollarChange]),
      percentChange: row[idx.percentChange] || '',
      total: totalVal,
      isEOYRow: isEOY,
      isFutureMonth: isFuture,
    });

    if (isEOY && /^\d{4}$/.test(colA)) {
      currentYear = parseInt(colA, 10) + 1;
    }
  });

  return parsedRows;
};

// TODO: Unused at the moment 
export const addSavingsEntry = async (entry: SavingsEntry): Promise<APIResponse> => {
  const response = await fetch(`${API_BASE_URL}/savings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  const result: APIResponse = await response.json();
  if (!result.success) throw new Error(result.error);
  return result;
};