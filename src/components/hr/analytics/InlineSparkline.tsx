import { useMemo } from "react";
import { motion } from "framer-motion";

interface InlineSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showTrend?: boolean;
  className?: string;
}

/**
 * Tufte-style sparkline: minimal, no axes, just the data
 * Following the principle of maximizing data-ink ratio
 */
export function InlineSparkline({
  data,
  width = 48,
  height = 16,
  color = "currentColor",
  showTrend = true,
  className = "",
}: InlineSparklineProps) {
  const { path, trend, trendPercent } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: "", trend: "stable" as const, trendPercent: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize data points to SVG coordinates
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    // Calculate trend
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    const trend = percentChange > 3 ? "up" : percentChange < -3 ? "down" : "stable";

    return {
      path: `M${points.join(" L")}`,
      trend,
      trendPercent: Math.round(percentChange),
    };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* End dot - Tufte's emphasis on the current value */}
        <motion.circle
          cx={width}
          cy={height - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4) - 2}
          r={2}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.2 }}
        />
      </svg>
      
      {showTrend && trend !== "stable" && (
        <span className={`text-[10px] font-medium ${
          trend === "up" ? "text-emerald-600" : "text-amber-600"
        }`}>
          {trend === "up" ? "↗" : "↘"}
        </span>
      )}
    </div>
  );
}
