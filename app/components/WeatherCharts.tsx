'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, AreaChart, BarChart,
  Line, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { zones } from '@/data/cities/sf-bay/zones';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Only show Bay zones (exclude ocean)
const BAY_ZONES = zones.filter(z => !z.id.startsWith('ocean'));

const ZONE_COLORS: Record<string, string> = {
  richardson:  '#10b981', // green — safest
  central_bay: '#f59e0b', // amber — most exposed
  sf_shore:    '#3b82f6', // blue
  east_bay:    '#14b8a6', // teal
  north_bay:   '#8b5cf6', // purple
  san_pablo:   '#ef4444', // red — roughest
  south_bay:   '#d4a853', // gold
};

const ZONE_LABELS: Record<string, string> = {
  richardson:  'Richardson Bay',
  central_bay: 'The Slot',
  sf_shore:    'SF Waterfront',
  east_bay:    'East Bay',
  north_bay:   'North Bay',
  san_pablo:   'San Pablo Bay',
  south_bay:   'South Bay',
};

type TimeOfDay = 'am' | 'pm';
type ChartView = 'comfort' | 'wind' | 'waves';

// Transform zone data to recharts format
function buildChartData(period: TimeOfDay) {
  return MONTHS.map((label, i) => {
    const row: Record<string, string | number> = { month: label };
    for (const zone of BAY_ZONES) {
      const mc = zone.monthlyConditions[i];
      const cond = period === 'am' ? mc.am : mc.pm;
      row[`${zone.id}_comfort`] = cond.comfort;
      row[`${zone.id}_wind`] = cond.windKts;
      row[`${zone.id}_wave`] = cond.waveHtFt;
    }
    return row;
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ocean-900 border border-ocean-700/50 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="font-semibold text-compass-gold mb-1">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-ocean-300">{entry.name}:</span>
          <span className="font-medium text-ocean-50">{entry.value}{entry.unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

export function WeatherCharts() {
  const [period, setPeriod] = useState<TimeOfDay>('pm');
  const [chartView, setChartView] = useState<ChartView>('comfort');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const data = useMemo(() => buildChartData(period), [period]);

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Chart type */}
        <div className="flex gap-1">
          {([
            { id: 'comfort', label: 'Comfort Score' },
            { id: 'wind', label: 'Wind Speed' },
            { id: 'waves', label: 'Wave Height' },
          ] as const).map(v => (
            <button
              key={v.id}
              onClick={() => setChartView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartView === v.id
                  ? 'bg-compass-gold text-ocean-900'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-compass-gold/50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* AM/PM toggle */}
        <div className="flex gap-1">
          {(['am', 'pm'] as const).map(t => (
            <button
              key={t}
              onClick={() => setPeriod(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === t
                  ? 'bg-reef-teal text-white'
                  : 'bg-[var(--card)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
              }`}
            >
              {t === 'am' ? 'Morning' : 'Afternoon'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {chartView === 'comfort' && `${period === 'am' ? 'Morning' : 'Afternoon'} Comfort Score by Zone`}
            {chartView === 'wind' && `${period === 'am' ? 'Morning' : 'Afternoon'} Wind Speed by Zone`}
            {chartView === 'waves' && `${period === 'am' ? 'Morning' : 'Afternoon'} Wave Height by Zone`}
          </h3>
          <p className="text-2xs text-[var(--muted)]">
            {chartView === 'comfort' && 'Higher is better. Based on historical averages for wind, waves, and overall conditions.'}
            {chartView === 'wind' && 'Average wind speed in knots. SF Bay thermals build strongly in summer afternoons.'}
            {chartView === 'waves' && 'Average wave height in feet. Steep chop builds with afternoon wind, especially in exposed zones.'}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          {chartView === 'comfort' ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <defs>
                {BAY_ZONES.map(z => (
                  <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ZONE_COLORS[z.id]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ZONE_COLORS[z.id]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" />
              <YAxis domain={[0, 10]} tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'Good', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'Poor', fill: '#ef4444', fontSize: 10, position: 'right' }} />
              {BAY_ZONES.map(z => (
                <Area
                  key={z.id}
                  type="monotone"
                  dataKey={`${z.id}_comfort`}
                  name={ZONE_LABELS[z.id]}
                  stroke={ZONE_COLORS[z.id]}
                  fill={`url(#grad-${z.id})`}
                  strokeWidth={selectedZone === null || selectedZone === z.id ? 2.5 : 1}
                  strokeOpacity={selectedZone === null || selectedZone === z.id ? 1 : 0.2}
                  fillOpacity={selectedZone === null || selectedZone === z.id ? 1 : 0}
                />
              ))}
            </AreaChart>
          ) : chartView === 'wind' ? (
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" />
              <YAxis tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" unit=" kt" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Small craft', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              {BAY_ZONES.map(z => (
                <Line
                  key={z.id}
                  type="monotone"
                  dataKey={`${z.id}_wind`}
                  name={ZONE_LABELS[z.id]}
                  stroke={ZONE_COLORS[z.id]}
                  strokeWidth={selectedZone === null || selectedZone === z.id ? 2.5 : 1}
                  strokeOpacity={selectedZone === null || selectedZone === z.id ? 1 : 0.15}
                  dot={false}
                  unit=" kt"
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" />
              <YAxis tick={{ fill: '#7ba3c9', fontSize: 11 }} stroke="#1e3a5f" unit=" ft" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Choppy', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              {(selectedZone ? BAY_ZONES.filter(z => z.id === selectedZone) : BAY_ZONES.slice(0, 3)).map(z => (
                <Bar
                  key={z.id}
                  dataKey={`${z.id}_wave`}
                  name={ZONE_LABELS[z.id]}
                  fill={ZONE_COLORS[z.id]}
                  fillOpacity={0.8}
                  radius={[2, 2, 0, 0]}
                  unit=" ft"
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>

        {/* Zone legend — clickable to filter */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]">
          <button
            onClick={() => setSelectedZone(null)}
            className={`px-2 py-1 rounded text-2xs font-medium transition-colors ${
              selectedZone === null
                ? 'bg-compass-gold/20 text-compass-gold border border-compass-gold/40'
                : 'text-[var(--muted)] border border-[var(--border)] hover:border-compass-gold/30'
            }`}
          >
            All Zones
          </button>
          {BAY_ZONES.map(z => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-2xs font-medium transition-colors ${
                selectedZone === z.id
                  ? 'border'
                  : 'text-[var(--muted)] border border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
              style={selectedZone === z.id ? { borderColor: ZONE_COLORS[z.id], color: ZONE_COLORS[z.id], backgroundColor: `${ZONE_COLORS[z.id]}15` } : undefined}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[z.id] }} />
              {ZONE_LABELS[z.id]}
            </button>
          ))}
        </div>
      </div>

      {/* Insight callout */}
      <div className="bg-reef-teal/5 border border-reef-teal/20 rounded-lg p-3 text-xs text-[var(--secondary)]">
        <span className="font-medium text-reef-teal">Best window:</span>{' '}
        September and October offer the calmest conditions across all zones.
        Morning departures are consistently 2-3x calmer than afternoons year-round.
        {period === 'pm' && ' Switch to "Morning" to see the difference.'}
      </div>
    </div>
  );
}
