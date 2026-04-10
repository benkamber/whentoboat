/**
 * Typed wrapper around @vercel/analytics custom events.
 *
 * Rules from the Vercel Analytics SDK (dist/react/index.d.ts):
 * - Properties must be flat primitives only (string | number | boolean | null | undefined)
 * - No nested objects or arrays
 * - Client-side only — never call from a server component
 *
 * Wrap every call site through this module so:
 * - Event names are typechecked (typos become TS errors)
 * - Ad-blocker / private-mode failures can't break the app
 * - We have one grep target for "what are we measuring"
 */

'use client';

import { track as vercelTrack } from '@vercel/analytics';

export type EventName =
  | 'activity_selected'
  | 'origin_selected'
  | 'destination_opened'
  | 'trusted_plan_confirmed'
  | 'source_link_clicked'
  | 'checklist_item_toggled'
  | 'vessel_customized'
  | 'empty_state_shown'
  | 'feedback_submitted'
  | 'route_saved';

type Primitive = string | number | boolean | null | undefined;
export type EventProps = Record<string, Primitive>;

/**
 * Fire a custom analytics event. Swallows all errors — analytics failures
 * must never break the product.
 */
export function track(name: EventName, properties?: EventProps): void {
  try {
    vercelTrack(name, properties);
  } catch {
    // Ad-blockers, private mode, and Safari ITP can throw. Swallow.
  }
}
