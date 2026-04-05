'use client';
import type { Source } from '@/engine/types';

export function SourceAttribution({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[var(--muted)]">
        Verify all information before departure.
      </p>
      {sources.map((src, i) => (
        <div key={i} className="text-[11px]">
          {src.url ? (
            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              {src.name}
            </a>
          ) : (
            <span className="text-[var(--secondary)]">{src.name}</span>
          )}
          {src.section && <span className="text-[var(--muted)] ml-1">({src.section})</span>}
          <span className="text-[var(--muted)] ml-1">&middot; {src.date}</span>
        </div>
      ))}
    </div>
  );
}
