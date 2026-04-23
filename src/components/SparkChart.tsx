import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyMetric } from '@/lib/types'

interface SparkChartProps {
  data: DailyMetric[]
  field: keyof DailyMetric
  color: string
  label: string
  icon: string
  formatter?: (v: number) => string
  avg?: string        // pre-formatted period average, e.g. "6.8h"
  trend?: 'up' | 'down' | 'flat'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div
      className="rounded-2xl px-3 py-2 text-[12px]"
      style={{
        background: 'rgba(10,15,30,0.9)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="text-white/40 mb-0.5">{label}</div>
      <div className="text-white font-semibold">{formatter ? formatter(val) : val}</div>
    </div>
  )
}

function TrendArrow({ trend, color }: { trend: 'up' | 'down' | 'flat'; color: string }) {
  const trendColor = trend === 'up' ? '#30D158' : trend === 'down' ? '#FF453A' : 'rgba(255,255,255,0.25)'
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  return (
    <span
      className="text-[12px] font-bold px-1.5 py-0.5 rounded-lg ml-1"
      style={{ color: trendColor, background: `${trendColor}18` }}
      title={`Trend: ${trend}`}
    >
      {arrow}
    </span>
  )
}

export default function SparkChart({ data, field, color, label, icon, formatter, avg, trend }: SparkChartProps) {
  const chartData = data
    .filter((d) => d[field] !== undefined)
    .map((d) => ({
      date: d.date.slice(5), // MM-DD
      value: d[field] as number,
    }))
    .slice(-30)

  if (chartData.length < 2) {
    return (
      <div
        className="glass-card p-5 flex flex-col items-center justify-center"
        style={{ minHeight: 180 }}
      >
        <span className="text-3xl mb-2">{icon}</span>
        <p className="text-[13px] text-white/35">Not enough data yet</p>
      </div>
    )
  }

  const values = chartData.map((d) => d.value)
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const change = ((latest - prev) / prev) * 100
  const changeColor = change >= 0 ? '#30D158' : '#FF453A'
  const changeSign = change >= 0 ? '+' : ''

  return (
    <div className="glass-card p-5" style={{ minHeight: 180 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{label}</span>
            {trend && <TrendArrow trend={trend} color={color} />}
          </div>
          <div className="text-[28px] font-bold text-white/92 leading-none">
            {formatter ? formatter(latest) : latest}
          </div>
          {avg && (
            <div className="text-[11px] text-white/35 mt-0.5">
              avg {avg}
            </div>
          )}
        </div>
        <div
          className="text-[13px] font-bold px-2.5 py-1 rounded-xl"
          style={{
            color: changeColor,
            background: `${changeColor}18`,
            border: `1px solid ${changeColor}28`,
          }}
        >
          {changeSign}{change.toFixed(1)}%
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${field})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'transparent' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
