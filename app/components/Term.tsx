/**
 * Inline marine-jargon term with tooltip.
 *
 * Usage:
 *   <Term id="tss" />                       — renders "TSS" with tooltip
 *   <Term id="tss">shipping lane</Term>     — renders "shipping lane" with tooltip
 *   <Term id="tss" showAbbr />              — renders "shipping lane (TSS)"
 *
 * Uses native <abbr> with a dotted underline so the affordance matches
 * platform conventions. The tooltip text comes from lib/glossary.ts.
 */

import type { ReactNode } from 'react';
import { GLOSSARY, type GlossaryId } from '@/lib/glossary';

interface TermProps {
  id: GlossaryId;
  children?: ReactNode;
  showAbbr?: boolean;
}

export function Term({ id, children, showAbbr = false }: TermProps) {
  const entry = GLOSSARY[id];
  const content =
    children != null
      ? children
      : showAbbr
        ? `${entry.short} (${entry.abbr})`
        : entry.abbr;

  return (
    <abbr
      title={entry.tooltip}
      className="underline decoration-dotted decoration-[var(--muted)] underline-offset-2 no-underline [text-decoration-line:underline] [text-decoration-style:dotted] cursor-help"
    >
      {content}
    </abbr>
  );
}
