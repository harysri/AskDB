import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MAX_CHART_POINTS,
  MAX_PIE_SLICES,
  MAX_SERIES,
  analyzeTable,
  recommendChartType,
  toChartRows,
} from "../utils/chartData";

const SERIES_COLORS = [
  "#c3c0ff",
  "#4cd7f6",
  "#ffb4ab",
  "#a8afff",
  "#93e8ff",
  "#f2a4c6",
];

const PIE_COLORS = [
  "#c3c0ff",
  "#4cd7f6",
  "#a8afff",
  "#93e8ff",
  "#ffb4ab",
  "#f2a4c6",
  "#7ee0c2",
  "#ffd6a5",
  "#e2dfff",
  "#bdb2ff",
  "#9bf6ff",
  "#fdffb6",
  "#caffbf",
  "#ffadad",
  "#a0c4ff",
  "#b9fbc0",
  "#90dbf4",
  "#f1c0e8",
  "#ffcfd2",
  "#98f5e1",
];

const TOOLTIP_STYLE = {
  backgroundColor: "#1b1b20",
  border: "1px solid rgba(70, 69, 85, 0.55)",
  borderRadius: "12px",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
};
const TOOLTIP_LABEL_STYLE = { color: "#918fa1", marginBottom: "4px" };
const TOOLTIP_ITEM_STYLE = { color: "#c7c4d8" };
const LEGEND_STYLE = { fontSize: "12px", color: "#c7c4d8", paddingTop: "8px" };

const fullFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 4 });
const compactFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatFull = (value) =>
  typeof value === "number" ? fullFormat.format(value) : value;
const formatCompact = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return compactFormat.format(value);
};

const formatTickLabel = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const timeIndex = text.indexOf("T");
  const withoutTime = timeIndex > 0 ? text.slice(0, timeIndex) : text;
  return withoutTime.length > 18 ? `${withoutTime.slice(0, 17)}…` : withoutTime;
};

const CHART_HEIGHT = 320;

const ResultChart = ({ headers, rows, analysis }) => {
  const resolvedAnalysis = useMemo(
    () => analysis || analyzeTable(headers, rows),
    [analysis, headers, rows],
  );

  const { chartable, labelKey, labelName, series } = resolvedAnalysis;

  const { data, shown, total } = useMemo(
    () => toChartRows(resolvedAnalysis, rows, MAX_CHART_POINTS),
    [resolvedAnalysis, rows],
  );

  const [chartType, setChartType] = useState(() =>
    recommendChartType(resolvedAnalysis),
  );
  const [pieMeasureIndex, setPieMeasureIndex] = useState(0);

  if (!chartable || data.length === 0) return null;

  const activeSeries = series.slice(0, MAX_SERIES);
  const seriesTruncated = series.length > MAX_SERIES;

  const canPie =
    resolvedAnalysis.labelColumn !== null &&
    resolvedAnalysis.categoryCount <= MAX_PIE_SLICES;

  const effectiveType =
    chartType && (chartType !== "pie" || canPie) ? chartType : "bar";
  const pieMeasure =
    activeSeries[Math.min(pieMeasureIndex, activeSeries.length - 1)];

  const pieData =
    effectiveType === "pie"
      ? data
          .map((point) => ({
            name: formatTickLabel(point[labelKey]),
            value: point[pieMeasure.key],
          }))
          .filter(
            (slice) => typeof slice.value === "number" && slice.value >= 0,
          )
      : [];

  const chartTypeButton = (type, label, icon, enabled) => (
    <button
      type="button"
      onClick={() => enabled && setChartType(type)}
      aria-pressed={effectiveType === type}
      title={enabled ? `${label} chart` : "Not available for this result"}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-label-mono transition-colors ${
        effectiveType === type
          ? "bg-surface-container-high text-primary"
          : enabled
            ? "text-on-surface-variant hover:text-on-surface"
            : "text-on-surface-variant/40 cursor-not-allowed"
      }`}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      {label}
    </button>
  );

  const notes = [];
  if (total > shown) {
    notes.push(`Showing first ${shown} of ${total} rows`);
  }
  if (seriesTruncated) {
    notes.push(`showing first ${activeSeries.length} numeric columns`);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest/50">
      {/* Chart toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-outline-variant/30">
        <div className="inline-flex items-center rounded-lg bg-surface-container-lowest border border-outline-variant/30 p-0.5">
          {chartTypeButton("bar", "Bar", "bar_chart", true)}
          {chartTypeButton("line", "Line", "show_chart", true)}
          {chartTypeButton("pie", "Pie", "pie_chart", canPie)}
        </div>

        {effectiveType === "pie" && activeSeries.length > 1 && (
          <select
            value={Math.min(pieMeasureIndex, activeSeries.length - 1)}
            onChange={(event) => setPieMeasureIndex(Number(event.target.value))}
            aria-label="Measure to chart"
            className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant text-label-md rounded-md px-2 py-1 outline-none cursor-pointer"
          >
            {activeSeries.map((measure, index) => (
              <option key={measure.key} value={index}>
                {measure.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT} className="p-2">
        {effectiveType === "pie" ? (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="80%"
              stroke="#131318"
              strokeWidth={2}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(value, name) => [formatFull(value), name]}
            />
          </PieChart>
        ) : effectiveType === "line" ? (
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(70, 69, 85, 0.35)"
              vertical={false}
            />
            <XAxis
              dataKey={labelKey}
              tick={{ fill: "#c7c4d8", fontSize: 11 }}
              stroke="#918fa1"
              tickFormatter={formatTickLabel}
              interval="equidistantPreserveStart"
            />
            <YAxis
              width={56}
              tick={{ fill: "#c7c4d8", fontSize: 11 }}
              stroke="#918fa1"
              tickFormatter={formatCompact}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(value) => formatFull(value)}
            />
            {activeSeries.length > 1 && (
              <Legend
                wrapperStyle={LEGEND_STYLE}
                iconType="circle"
                iconSize={8}
              />
            )}
            {activeSeries.map((measure, index) => (
              <Line
                key={measure.key}
                type="monotone"
                dataKey={measure.key}
                name={measure.name}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2}
                dot={data.length <= 20}
                activeDot={{ r: 4 }}
                isAnimationActive
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(70, 69, 85, 0.35)"
              vertical={false}
            />
            <XAxis
              dataKey={labelKey}
              tick={{ fill: "#c7c4d8", fontSize: 11 }}
              stroke="#918fa1"
              tickFormatter={formatTickLabel}
              interval="equidistantPreserveStart"
            />
            <YAxis
              width={56}
              tick={{ fill: "#c7c4d8", fontSize: 11 }}
              stroke="#918fa1"
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ fill: "rgba(195, 192, 255, 0.06)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(value) => formatFull(value)}
            />
            {activeSeries.length > 1 && (
              <Legend
                wrapperStyle={LEGEND_STYLE}
                iconType="circle"
                iconSize={8}
              />
            )}
            {activeSeries.map((measure, index) => (
              <Bar
                key={measure.key}
                dataKey={measure.key}
                name={measure.name}
                fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                isAnimationActive
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="px-4 pb-2.5 flex items-center justify-between text-[11px] text-on-surface-variant/40">
        <span className="text-label-mono">
          <span className="material-symbols-outlined text-xs align-middle mr-1">
            insert_chart
          </span>
          By {labelKey === "__index" ? "row" : labelName.toLowerCase()}
        </span>
        {notes.length > 0 && <span>{notes.join(" · ")}</span>}
      </div>
    </div>
  );
};

export default ResultChart;
