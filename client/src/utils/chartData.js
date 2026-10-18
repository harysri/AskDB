const NUMERIC_SAMPLE_LIMIT = 50;
const NUMERIC_COLUMN_THRESHOLD = 0.8;
const TEMPORAL_THRESHOLD = 0.7;
const PIE_RECOMMEND_MAX_CATEGORIES = 12;

export const MAX_CHART_POINTS = 100;
export const MAX_PIE_SLICES = 20;
export const MAX_SERIES = 6;

const NUMERIC_STRING_RE = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

const TEMPORAL_PATTERNS = [
  /^\d{4}-\d{1,2}(-\d{1,2})?([T ].*)?$/,
  /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/,
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[ .\-/]?\d{0,4}$/i,
  /^q[1-4][ .\-/]?\d{4}$/i,
];

const EMPTY_ANALYSIS = Object.freeze({
  chartable: false,
  labelColumn: null,
  labelKey: null,
  labelName: "",
  numericColumns: [],
  series: [],
  categoryCount: 0,
  isTemporal: false,
});

function isNumericValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "");
    if (!cleaned || !NUMERIC_STRING_RE.test(cleaned)) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function looksTemporal(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return TEMPORAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function profileColumn(rows, columnIndex) {
  let nonNull = 0;
  let numeric = 0;
  let temporal = 0;
  const sample = rows.slice(0, NUMERIC_SAMPLE_LIMIT);

  for (const row of sample) {
    if (!Array.isArray(row)) continue;
    const cell = row[columnIndex];
    if (cell === null || cell === undefined || cell === "") continue;
    nonNull += 1;
    if (isNumericValue(cell) !== null) numeric += 1;
    if (looksTemporal(cell)) temporal += 1;
  }

  return {
    nonNull,
    numericRatio: nonNull ? numeric / nonNull : 0,
    isNumeric: nonNull > 0 && numeric > 0 && numeric / nonNull >= NUMERIC_COLUMN_THRESHOLD,
    temporalRatio: nonNull ? temporal / nonNull : 0,
  };
}

function displayName(header, index) {
  return header !== null && header !== undefined && String(header).trim() !== ""
    ? String(header)
    : `Column ${index + 1}`;
}

export function analyzeTable(headers, rows) {
  if (!Array.isArray(rows) || rows.length < 2) return EMPTY_ANALYSIS;

  const columnCount = Array.isArray(headers) ? headers.length : 0;
  if (columnCount === 0) return EMPTY_ANALYSIS;

  const profiles = [];
  for (let i = 0; i < columnCount; i += 1) {
    profiles.push(profileColumn(rows, i));
  }

  let labelColumn = null;
  for (let i = 0; i < columnCount; i += 1) {
    if (!profiles[i].isNumeric) {
      labelColumn = i;
      break;
    }
  }

  const numericColumns = [];
  for (let i = 0; i < columnCount; i += 1) {
    if (i !== labelColumn && profiles[i].isNumeric) numericColumns.push(i);
  }

  const chartable = numericColumns.length >= 1;
  if (!chartable) return EMPTY_ANALYSIS;

  const isTemporal =
    labelColumn !== null && profiles[labelColumn].temporalRatio >= TEMPORAL_THRESHOLD;

  const series = numericColumns.map((index) => ({
    key: `c${index}`,
    name: displayName(headers[index], index),
  }));

  return {
    chartable: true,
    labelColumn,
    labelKey: labelColumn !== null ? `c${labelColumn}` : "__index",
    labelName: labelColumn !== null ? displayName(headers[labelColumn], labelColumn) : "Row",
    numericColumns,
    series,
    categoryCount: rows.length,
    isTemporal,
  };
}

export function recommendChartType(analysis) {
  if (!analysis || !analysis.chartable) return null;
  if (analysis.isTemporal) return "line";
  if (
    analysis.labelColumn !== null &&
    analysis.series.length === 1 &&
    analysis.categoryCount <= PIE_RECOMMEND_MAX_CATEGORIES
  ) {
    return "pie";
  }
  return "bar";
}

/**
 * Maps raw result rows into recharts-friendly objects.
 * Column keys are index-based (`c0`, `c1`, ...) so duplicate or empty
 * header names can never collide. Rows with a missing/empty label are
 * skipped; missing measure values become `null` (gaps, not zeros).
 */
export function toChartRows(analysis, rows, maxPoints = MAX_CHART_POINTS) {
  if (!analysis || !analysis.chartable || !Array.isArray(rows)) {
    return { data: [], shown: 0, total: 0 };
  }

  const { labelColumn, labelKey, numericColumns } = analysis;
  const data = [];

  const visibleRows = Math.min(rows.length, maxPoints);
  for (let i = 0; i < visibleRows; i += 1) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let label;
    if (labelColumn !== null) {
      const cell = row[labelColumn];
      if (cell === null || cell === undefined || cell === "") continue;
      label = typeof cell === "string" ? cell : String(cell);
    } else {
      label = `#${i + 1}`;
    }

    const point = { [labelKey]: label };
    let hasValue = false;
    for (const colIndex of numericColumns) {
      const parsed = isNumericValue(row[colIndex]);
      point[`c${colIndex}`] = parsed;
      if (parsed !== null) hasValue = true;
    }

    if (!hasValue) continue;
    data.push(point);
  }

  return { data, shown: data.length, total: rows.length };
}
