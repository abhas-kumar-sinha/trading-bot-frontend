import React, { useMemo, useState, useEffect, useRef } from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath, Bar } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { localPoint } from "@visx/event";
import {
  useTooltip,
  TooltipWithBounds,
  defaultStyles as visxTooltipStyles,
} from "@visx/tooltip";

type Point = { x: Date; y: number };

type Series = {
  id: string;
  label: string;
  color: string;
  data: Point[];
};

const initialCapital = 1000;

// ---- dummy 30-day data ----
const makeBalance = (arr: number[]): Point[] =>
  arr.map((v, i) => ({
    x: new Date(Date.now() - (29 - i) * 86400000), // Start 30 days ago
    y: v,
  }));

const series: Series[] = [
  {
    id: "gemini",
    label: "Gemini",
    color: "#4285F4",
    data: makeBalance([
      1000, 1020, 1050, 1035, 990, 960, 980, 1010, 1045, 1080,
      1120, 1095, 1130, 1150, 1140, 1110, 1095, 1125, 1160, 1145,
      1175, 1155, 1190, 1210, 1185, 1220, 1245, 1230, 1260, 1280
    ]),
  },
  {
    id: "gpt",
    label: "GPT",
    color: "#10a37f",
    data: makeBalance([
      1000, 985, 1010, 970, 940, 910, 920, 895, 920, 945,
      915, 890, 915, 895, 870, 855, 880, 860, 835, 850,
      825, 845, 820, 840, 815, 830, 810, 825, 805, 820
    ]),
  },
  {
    id: "claude",
    label: "Claude",
    color: "#ff6b35",
    data: makeBalance([
      1000, 995, 1005, 1000, 1002, 998, 1001, 1008, 1012, 1015,
      1020, 1018, 1025, 1030, 1028, 1035, 1040, 1038, 1045, 1050,
      1048, 1055, 1060, 1058, 1065, 1070, 1068, 1075, 1080, 1078
    ]),
  },
];
const margin = { top: 40, right: 40, bottom: 40, left: 70 };

type TooltipData = {
  x: Date;
  y: number;
  seriesId: string;
  label: string;
  color: string;
};

export default function ArenaChart({width, height}: {width: number, height: number}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [themeColors, setThemeColors] = useState({
    foreground: "#e5e7eb",
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateThemeColors = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      const foregroundColor = rootStyles.getPropertyValue("--foreground").trim();
      
      setThemeColors({
        foreground: foregroundColor || "#e5e7eb",
      });
      setIsReady(true);
    };

    // Initial update
    updateThemeColors();

    // Listen for theme changes
    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, []);
  
  const allPoints = series.flatMap((s) => s.data);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Move domain calculations inside useMemo to fix React hooks warning
  const xScale = useMemo(() => {
    const xDomain: [number, number] = [
      Math.min(...allPoints.map((d) => d.x.getTime())),
      Math.max(...allPoints.map((d) => d.x.getTime())),
    ];
    
    return scaleTime<number>({
      domain: xDomain,
      range: [0, innerWidth],
    });
  }, [allPoints, innerWidth]);

  const yScale = useMemo(() => {
    const minY = Math.min(...allPoints.map((d) => d.y));
    const maxY = Math.max(...allPoints.map((d) => d.y));
    
    // 🔥 Force domain to show losses even if they never occurred
    const yDomain: [number, number] = [
      Math.min(minY, initialCapital * 0.7),
      Math.max(maxY, initialCapital * 1.2),
    ];
    
    return scaleLinear<number>({
      domain: yDomain,
      range: [innerHeight, 0],
      nice: true,
    });
  }, [allPoints, innerHeight]);

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft,
    tooltipTop,
  } = useTooltip<TooltipData>();

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    const point = localPoint(event);
    if (!point) return;

    const xInChart = point.x - margin.left;
    const yInChart = point.y - margin.top;

    // Find nearest point across all series based on actual distance
    let nearest: TooltipData | null = null;
    let minDist = Infinity;

    for (const s of series) {
      for (const d of s.data) {
        const px = xScale(d.x) ?? 0;
        const py = yScale(d.y) ?? 0;
        
        // Calculate Euclidean distance from mouse to point
        const dx = px - xInChart;
        const dy = py - yInChart;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearest = {
            x: d.x,
            y: d.y,
            seriesId: s.id,
            label: s.label,
            color: s.color,
          };
        }
      }
    }

    if (!nearest) return;

    const left = margin.left + (xScale(nearest.x) ?? 0);
    const top = margin.top + (yScale(nearest.y) ?? 0);

    showTooltip({
      tooltipData: nearest,
      tooltipLeft: left,
      tooltipTop: top,
    });
  };

  const activeSeriesId = tooltipData?.seriesId;

  const tooltipStyles = {
    ...visxTooltipStyles,
    backgroundColor: "hsl(var(--background))",
    borderRadius: 8,
    border: `1px solid hsl(var(--border))`,
    color: "hsl(var(--foreground))",
    padding: "8px 10px",
    fontSize: 12,
  };

  // Guard: if no data, don't crash
  if (allPoints.length === 0) {
    return <div>No data</div>;
  }

  if (!isReady) {
    return <div style={{ width, height }} />;
  }

  return (
    <div ref={chartRef} style={{ position: "relative", width, height, backgroundColor: "transparent" }}>
      <svg width={width} height={height} style={{ backgroundColor: "transparent" }}>
        <Group left={margin.left} top={margin.top}>
          {/* grid */}
          <g opacity={0.1}>
            {/* Horizontal grid lines - reduced to 4 ticks */}
            {yScale.ticks(4).map((t, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                x2={innerWidth}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke={themeColors.foreground}
                strokeWidth={1}
              />
            ))}
            {/* Vertical grid lines - reduced to 5 ticks */}
            {xScale.ticks(5).map((t, i) => (
              <line
                key={`v-${i}`}
                x1={xScale(t)}
                x2={xScale(t)}
                y1={0}
                y2={innerHeight}
                stroke={themeColors.foreground}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* baseline at initial capital */}
          <line
            x1={0}
            x2={innerWidth}
            y1={yScale(initialCapital)}
            y2={yScale(initialCapital)}
            stroke={themeColors.foreground}
            strokeOpacity={0.3}
            strokeWidth={1}
          />

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={themeColors.foreground}
            tickStroke={themeColors.foreground}
            tickLabelProps={() => ({
              fill: themeColors.foreground,
              fontSize: 11,
              textAnchor: 'middle',
            })}
            tickFormat={(d) =>
              (d as Date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
          />
          <AxisLeft
            scale={yScale}
            stroke={themeColors.foreground}
            tickStroke={themeColors.foreground}
            tickLabelProps={() => ({
              fill: themeColors.foreground,
              fontSize: 11,
              textAnchor: 'end',
            })}
            tickFormat={(v) => `$${Number(v).toFixed(0)}`}
          />

          {/* crosshair */}
          {tooltipData && (
            <line
              x1={xScale(tooltipData.x)}
              x2={xScale(tooltipData.x)}
              y1={0}
              y2={innerHeight}
              stroke={themeColors.foreground}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}

          {/* lines */}
          {series.map((s) => {
            const isActive = activeSeriesId === s.id;
            const opacity = activeSeriesId
              ? isActive
                ? 1
                : 0.25
              : 0.9;
            const strokeWidth = isActive ? 3 : 2;

            return (
              <LinePath
                key={s.id}
                data={s.data}
                x={(d) => xScale(d.x) ?? 0}
                y={(d) => yScale(d.y) ?? 0}
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                curve={undefined}
              />
            );
          })}

          {/* active point highlight */}
          {tooltipData && (
            <g
              transform={`translate(${xScale(tooltipData.x)}, ${yScale(
                tooltipData.y
              )})`}
            >
              <circle
                r={9}
                fill="none"
                stroke={tooltipData.color}
                strokeOpacity={0.4}
              />
              <circle r={5} fill={tooltipData.color} />
            </g>
          )}

          {/* big invisible overlay to capture hover */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            cursor="crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={hideTooltip}
          />
        </Group>
      </svg>

      {/* Tooltip overlay */}
      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <TooltipWithBounds
          top={tooltipTop - 50}
          left={tooltipLeft + 10}
          style={tooltipStyles}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "9999px",
                backgroundColor: tooltipData.color,
              }}
            />
            <span style={{ fontWeight: 600 }}>{tooltipData.label}</span>
          </div>

          <div style={{ fontFamily: "monospace" }}>
            <div>
              {tooltipData.x.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>Balance: ${tooltipData.y.toFixed(2)}</div>
            <div
              style={{
                color:
                  tooltipData.y >= initialCapital ? "#22c55e" : "#ef4444",
              }}
            >
              {(() => {
                const pnl = tooltipData.y - initialCapital;
                const pct = (pnl / initialCapital) * 100;
                const sign = pnl >= 0 ? "+" : "";
                return `PnL: ${sign}${pnl.toFixed(2)} (${sign}${pct.toFixed(
                  2
                )}%)`;
              })()}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}