import { ImageResponse } from 'next/og';
import { sfBay } from '@/data/cities/sf-bay';
import { getActivity } from '@/data/activities';
import type { ActivityType } from '@/engine/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activity = (searchParams.get('activity') ?? 'kayak') as ActivityType;
  const destId = searchParams.get('dest') ?? 'ang';
  const originId = searchParams.get('origin') ?? 'sau';
  const hour = parseInt(searchParams.get('hour') ?? '9', 10);

  const dest = sfBay.destinations.find(d => d.id === destId);
  const origin = sfBay.destinations.find(d => d.id === originId);
  const act = getActivity(activity);

  const destName = dest?.name ?? 'SF Bay';
  const originName = origin?.name ?? 'SF Bay';
  const formatHour = (h: number) => h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a1628',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: activity badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#14b8a6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {act.icon} {act.name}
          </div>
          <span style={{ color: '#7ba3c9', fontSize: '20px' }}>
            {formatHour(hour)}
          </span>
        </div>

        {/* Center: destination */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#7ba3c9', fontSize: '24px' }}>
            From {originName}
          </div>
          <div style={{ color: '#f1f5f9', fontSize: '56px', fontWeight: 800, lineHeight: 1.1 }}>
            {destName}
          </div>
        </div>

        {/* Bottom: branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#d4a853', fontSize: '28px', fontWeight: 800 }}>
            WhenToBoat
          </div>
          <div style={{ color: '#7ba3c9', fontSize: '18px' }}>
            Plan smarter. Boat safer.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
