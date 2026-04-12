'use client';

import { useMemo, useState } from 'react';
import { useLiveForecast } from '@/hooks/useLiveForecast';
import { useMarineAlerts } from '@/hooks/useMarineAlerts';
import { useAppStore } from '@/store';
import { getActivity } from '@/data/activities';
import { sfBay } from '@/data/cities/sf-bay';
import { fullConditionsScore } from '@/engine/scoring';
import { getConditionTier, getTierInfo, type ConditionTier } from '@/lib/condition-tier';
import { TierBadge } from './ScoreBadge';
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-ocean-900 border border-ocean-700/50 rounded-lg px-3 py-2 shadow-xl text-xs space-y-0.5">
      <div className="font-semibold text-compass-gold">{label}</div>
      <div className="text-ocean-100">Tide: {data.tideFt?.toFixed(1)} ft ({data.tidePhase})</div>
      <div className="text-ocean-100">Wind: {data.windKts?.toFixed(0)} kt</div>
      {data.waveHtFt > 0 && <div className="text-ocean-100">Waves: {data.waveHtFt?.toFixed(1)} ft</div>}
    </div>
  );
}

export function ShouldIGo() {
  const { activity, vessel, homeBaseId, hour } = useAppStore();
  const { forecast, loading, error, getConditionsForHour } = useLiveForecast();
  const { hasActiveAlerts, hasGaleWarning, hasSmallCraftAdvisory } = useMarineAlerts();

  const origin = sfBay.destinations.find(d => d.id === homeBaseId);
  const act = getActivity(activity);

  // Score current conditions
  const result = useMemo(() => {
    if (!forecast || !origin) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const conditions = getConditionsForHour(now, currentHour);
    if (!conditions) return null;

    // Add zone context
    const conditionsWithZone = { ...conditions, zoneId: origin.zone };
    const { score, factors } = fullConditionsScore(act, conditionsWithZone, vessel);

    const tier = getConditionTier(score, {
      hasActiveWarning: hasGaleWarning || hasSmallCraftAdvisory,
    });

    return { score, tier, factors, conditions, currentHour };
  }, [forecast, origin, act, vessel, getConditionsForHour, hasGaleWarning, hasSmallCraftAdvisory]);

  // Build tide chart data for today
  const tideData = useMemo(() => {
    if (!forecast) return [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return forecast.hours
      .filter(h => h.time.startsWith(todayStr))
      .map(h => {
        const hourNum = new Date(h.time).getHours();
        return {
          hour: formatHour(hourNum),
          hourNum,
          tideFt: h.tideFt >= 0 ? h.tideFt : null,
          tidePhase: h.tidePhase,
          windKts: h.windSpeedKts,
          waveHtFt: h.waveHeightFt >= 0 ? h.waveHeightFt : 0,
        };
      });
  }, [forecast]);

  if (loading) {
    return (
      <div className="px-2 pt-2">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center text-sm text-[var(--muted)]">
          Loading conditions...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return null; // Silently hide if forecast unavailable
  }

  const tierInfo = getTierInfo(result.tier);
  const topFactors = result.factors.filter(f => f.severity === 'high' || f.severity === 'medium').slice(0, 3);

  // Find sunrise/sunset approximate times for reference lines
  const currentHourMark = result.currentHour;

  return (
    <div className="px-2 pt-2 space-y-2">
      {/* Should I Go? verdict */}
      <div className={`${tierInfo.bgClass} border ${tierInfo.borderClass} rounded-xl p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xs text-[var(--muted)] uppercase tracking-wider font-medium mb-1">
              Right now for {act.name.toLowerCase()}
            </div>
            <TierBadge tier={result.tier} size="lg" />
          </div>
          <div className="text-right">
            <div className="text-2xs text-[var(--muted)]">{origin?.name}</div>
            <div className="text-xs text-[var(--secondary)]">
              Wind {result.conditions.windKts.toFixed(0)} kt ·{' '}
              {result.conditions.tidePhase === 'flood' ? '↗ Flood' :
               result.conditions.tidePhase === 'ebb' ? '↘ Ebb' :
               result.conditions.tidePhase === 'slack_high' ? '— High slack' :
               '— Low slack'}
            </div>
          </div>
        </div>

        {/* Top risk factors */}
        {topFactors.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-[var(--border)]">
            {topFactors.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5 text-2xs">
                <span className={f.severity === 'high' ? 'text-danger-red' : 'text-warning-amber'}>
                  {f.severity === 'high' ? '●' : '○'}
                </span>
                <span className="text-[var(--secondary)]">{f.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Accuracy feedback */}
        <FeedbackButtons tier={result.tier} windKts={result.conditions.windKts} />

        <p className="text-2xs text-[var(--muted)] italic">
          Based on forecast data — conditions can change rapidly.
          Verify with <a href="https://www.weather.gov/marine" target="_blank" rel="noopener noreferrer" className="underline">NOAA</a>.
        </p>
      </div>

      {/* Tide chart */}
      {tideData.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-medium text-compass-gold uppercase tracking-wider">Today&apos;s Tide</span>
            <span className="text-2xs text-[var(--muted)]">NOAA CO-OPS prediction</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={tideData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#7ba3c9', fontSize: 9 }}
                stroke="#1e3a5f"
                interval={2}
              />
              <YAxis
                tick={{ fill: '#7ba3c9', fontSize: 9 }}
                stroke="#1e3a5f"
                unit=" ft"
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={formatHour(currentHourMark)}
                stroke="#d4a853"
                strokeDasharray="3 3"
                label={{ value: 'Now', fill: '#d4a853', fontSize: 9, position: 'top' }}
              />
              <Area
                type="monotone"
                dataKey="tideFt"
                stroke="#14b8a6"
                fill="url(#tideGrad)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function FeedbackButtons({ tier, windKts }: { tier: ConditionTier; windKts?: number }) {
  const { activity, homeBaseId, addFeedback, addInboxItem } = useAppStore();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="text-2xs text-reef-teal text-center">Thanks — this helps improve accuracy!</p>;
  }

  const handleFeedback = (rating: 'better' | 'about-right' | 'worse') => {
    addFeedback({
      date: new Date().toISOString().split('T')[0],
      activity,
      originId: homeBaseId,
      predictedTier: tier,
      actualRating: rating,
    });
    addInboxItem({
      type: 'feedback-thanks',
      title: 'Feedback recorded',
      body: `You rated today's ${tier.replace(/-/g, ' ')} forecast as "${rating}." This helps improve our accuracy.`,
    });
    setSubmitted(true);
  };

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
      <span className="text-2xs text-[var(--muted)]">How was it?</span>
      <button onClick={() => handleFeedback('better')} className="px-2 py-0.5 rounded text-2xs text-reef-teal bg-reef-teal/10 hover:bg-reef-teal/20 transition-colors">Better</button>
      <button onClick={() => handleFeedback('about-right')} className="px-2 py-0.5 rounded text-2xs text-compass-gold bg-compass-gold/10 hover:bg-compass-gold/20 transition-colors">About right</button>
      <button onClick={() => handleFeedback('worse')} className="px-2 py-0.5 rounded text-2xs text-warning-amber bg-warning-amber/10 hover:bg-warning-amber/20 transition-colors">Worse</button>
    </div>
  );
}
