'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { activities } from '@/data/activities';
import { useLiveForecast } from '@/hooks/useLiveForecast';
import { fullConditionsScore } from '@/engine/scoring';
import { getConditionTier, getTierInfo } from '@/lib/condition-tier';
import { vesselPresets } from '@/data/vessels';

/**
 * Embeddable conditions widget for partner websites.
 *
 * Usage:
 *   <iframe src="https://whentoboat.com/embed?location=skm&activity=kayak" width="320" height="200" />
 *   <iframe src="https://whentoboat.com/embed?location=skm&activity=kayak&book=https://seatrek.com/book" />
 *
 * Query params:
 *   location — destination ID (e.g., 'skm' for Schoonmaker Point)
 *   activity — activity ID (e.g., 'kayak', 'sup', 'powerboat_cruise')
 *   book — optional booking URL (shows "Book Now" button)
 *   partner — optional partner name (shown in attribution)
 */

function EmbedWidget() {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('location') ?? 'sau';
  const activityId = searchParams.get('activity') ?? 'kayak';
  const bookUrl = searchParams.get('book');
  const partnerName = searchParams.get('partner');

  const dest = sfBay.destinations.find(d => d.id === locationId);
  const act = activities.find(a => a.id === activityId) ?? activities[0];
  const vessel = vesselPresets.find(v => v.type === act.vesselType) ?? vesselPresets[0];

  const { forecast, loading, getConditionsForHour } = useLiveForecast();

  const result = useMemo(() => {
    if (!forecast || !dest) return null;
    const now = new Date();
    const conditions = getConditionsForHour(now, now.getHours());
    if (!conditions) return null;

    const conditionsWithZone = { ...conditions, zoneId: dest.zone };
    const { score, factors } = fullConditionsScore(act, conditionsWithZone, vessel);
    const tier = getConditionTier(score);
    const info = getTierInfo(tier);
    const topFactor = factors.find(f => f.severity === 'high' || f.severity === 'medium');

    return { tier, info, wind: Math.round(conditions.windKts), waterTemp: Math.round(conditions.waterTempF), tidePhase: conditions.tidePhase, reason: topFactor?.description, score };
  }, [forecast, dest, act, vessel, getConditionsForHour]);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a1628', color: '#f1f5f9', padding: '16px', borderRadius: '12px', maxWidth: '320px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#7ba3c9', fontWeight: 500 }}>
            {act.name} at {dest?.name ?? locationId}
          </div>
          <div style={{ fontSize: '11px', color: '#5a8ab5' }}>
            Right now
          </div>
        </div>
      </div>

      {/* Conditions */}
      {loading ? (
        <div style={{ fontSize: '13px', color: '#7ba3c9', textAlign: 'center', padding: '16px 0' }}>
          Checking conditions...
        </div>
      ) : result ? (
        <div>
          {/* Tier badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            background: `${result.info.color}20`, border: `1px solid ${result.info.color}40`, color: result.info.color,
          }}>
            {result.info.icon} {result.info.label}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: '#a3c4de' }}>
            <span>Wind {result.wind} kt</span>
            <span>Water {result.waterTemp}°F</span>
            <span>{result.tidePhase === 'flood' ? '↗ Flood' : result.tidePhase === 'ebb' ? '↘ Ebb' : '— Slack'}</span>
          </div>

          {/* Reason if notable */}
          {result.reason && (
            <div style={{ fontSize: '11px', color: '#7ba3c9', marginTop: '8px', lineHeight: 1.4 }}>
              {result.reason}
            </div>
          )}

          {/* Gear recommendation */}
          {result.waterTemp < 60 && (
            <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px' }}>
              Wetsuit recommended — water {result.waterTemp}°F
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#7ba3c9' }}>
          Conditions unavailable
        </div>
      )}

      {/* Book button */}
      {bookUrl && (
        <a
          href={bookUrl}
          target="_top"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', marginTop: '12px',
            padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
            background: '#14b8a6', color: '#0a1628', textDecoration: 'none',
          }}
        >
          Book Now →
        </a>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '10px', color: '#5a8ab5' }}>
        <span>Forecast data — verify before departure</span>
        <a href="https://whentoboat.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d4a853', textDecoration: 'none' }}>
          {partnerName ? `Powered by WhenToBoat` : 'WhenToBoat'}
        </a>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: 'system-ui', background: '#0a1628', color: '#7ba3c9', padding: '16px', borderRadius: '12px' }}>Loading...</div>}>
      <EmbedWidget />
    </Suspense>
  );
}
