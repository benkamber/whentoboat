// Activity-aware event relevance for trip planning.
// Maps event categories to how they affect each activity type.

import type { ActivityType } from '@/engine/types';
import type { BayEvent, EventCategory } from '@/data/cities/sf-bay/events';
import { getEventsForMonth } from '@/data/cities/sf-bay/events';

export type EventSentiment = 'fun' | 'caution' | 'avoid' | 'neutral';

export interface EventForTrip extends BayEvent {
  sentiment: EventSentiment;
  reason: string;
}

// Rules: how does each event category affect each activity?
// 'fun' = positive reason to go out  |  'caution' = be aware, stay clear of area
// 'avoid' = dangerous or impossible  |  'neutral' = doesn't affect you

const RELEVANCE_RULES: Record<EventCategory, Record<ActivityType, { sentiment: EventSentiment; reason: string }>> = {
  'major-regatta': {
    kayak:            { sentiment: 'avoid',   reason: 'Large racing fleet — dangerous for small craft' },
    sup:              { sentiment: 'avoid',   reason: 'Large racing fleet — dangerous for paddleboards' },
    powerboat_cruise: { sentiment: 'caution', reason: 'Fun to spectate — stay clear of race course' },
    casual_sail:      { sentiment: 'fun',     reason: 'Great spectating from the water' },
  },
  'club-regatta': {
    kayak:            { sentiment: 'caution', reason: 'Racing near this area — stay clear of start/finish' },
    sup:              { sentiment: 'caution', reason: 'Racing near this area — stay clear of start/finish' },
    powerboat_cruise: { sentiment: 'neutral', reason: 'Club racing nearby — minor congestion' },
    casual_sail:      { sentiment: 'fun',     reason: 'Club regatta — fun atmosphere ashore' },
  },
  'one-design': {
    kayak:            { sentiment: 'caution', reason: 'Fleet racing nearby — give them room' },
    sup:              { sentiment: 'caution', reason: 'Fleet racing nearby — give them room' },
    powerboat_cruise: { sentiment: 'neutral', reason: 'One-design racing nearby' },
    casual_sail:      { sentiment: 'fun',     reason: 'One-design fleet racing to watch' },
  },
  'midwinter': {
    kayak:            { sentiment: 'caution', reason: 'Winter racing — limited rescue resources' },
    sup:              { sentiment: 'caution', reason: 'Winter racing — limited rescue resources' },
    powerboat_cruise: { sentiment: 'neutral', reason: 'Midwinter racing nearby' },
    casual_sail:      { sentiment: 'fun',     reason: 'Midwinter series — join the fun' },
  },
  'beer-can': {
    kayak:            { sentiment: 'caution', reason: 'Evening racing fleet nearby — be visible' },
    sup:              { sentiment: 'caution', reason: 'Evening racing fleet nearby — be visible' },
    powerboat_cruise: { sentiment: 'neutral', reason: 'Casual evening racing nearby' },
    casual_sail:      { sentiment: 'fun',     reason: 'Beer-can racing — casual, welcoming' },
  },
  'offshore': {
    kayak:            { sentiment: 'neutral', reason: 'Offshore race — starts in Bay then heads to sea' },
    sup:              { sentiment: 'neutral', reason: 'Offshore race — minimal Bay impact' },
    powerboat_cruise: { sentiment: 'caution', reason: 'Fleet departing Bay — congestion at Gate' },
    casual_sail:      { sentiment: 'fun',     reason: 'Watch the fleet head offshore' },
  },
  'foil-race': {
    kayak:            { sentiment: 'avoid',   reason: 'High-speed foils (30+ knots) — extremely dangerous for small craft' },
    sup:              { sentiment: 'avoid',   reason: 'High-speed foils (30+ knots) — extremely dangerous for paddleboards' },
    powerboat_cruise: { sentiment: 'caution', reason: 'High-speed foil racing — unpredictable fast traffic' },
    casual_sail:      { sentiment: 'caution', reason: 'Foil racing — exciting but give wide berth' },
  },
  'boat-show': {
    kayak:            { sentiment: 'caution', reason: 'Boat show — crowded marina, fun to paddle past' },
    sup:              { sentiment: 'caution', reason: 'Boat show — crowded marina area' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Boat show — dock and browse' },
    casual_sail:      { sentiment: 'fun',     reason: 'Boat show — sail over and explore' },
  },
  'parade': {
    kayak:            { sentiment: 'avoid',   reason: 'Parade route with restricted zones — not safe for kayaks' },
    sup:              { sentiment: 'avoid',   reason: 'Parade route with restricted zones — not safe for SUPs' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Join or spectate the parade' },
    casual_sail:      { sentiment: 'fun',     reason: 'Join or spectate the parade' },
  },
  'fleet-week': {
    kayak:            { sentiment: 'avoid',   reason: 'USCG restricted zones — kayaks prohibited in air show box' },
    sup:              { sentiment: 'avoid',   reason: 'USCG restricted zones — SUPs prohibited in air show box' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Blue Angels from the water — follow USCG rules' },
    casual_sail:      { sentiment: 'fun',     reason: 'Blue Angels from the water — follow USCG rules' },
  },
  'lighted-parade': {
    kayak:            { sentiment: 'caution', reason: 'Nighttime parade — low visibility for small craft' },
    sup:              { sentiment: 'avoid',   reason: 'Nighttime parade — not safe for SUPs' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Lighted boat parade — decorate and join!' },
    casual_sail:      { sentiment: 'fun',     reason: 'Lighted boat parade — festive evening sail' },
  },
  'holiday': {
    kayak:            { sentiment: 'caution', reason: 'Holiday crowds — heavy boat traffic, stay visible' },
    sup:              { sentiment: 'caution', reason: 'Holiday crowds — heavy boat traffic, stay visible' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Holiday on the water — join the flotilla' },
    casual_sail:      { sentiment: 'fun',     reason: 'Holiday on the water — festive atmosphere' },
  },
  'swim': {
    kayak:            { sentiment: 'avoid',   reason: 'USCG swim corridor — vessels prohibited in course area' },
    sup:              { sentiment: 'avoid',   reason: 'USCG swim corridor — vessels prohibited in course area' },
    powerboat_cruise: { sentiment: 'avoid',   reason: 'USCG swim corridor — vessels prohibited in course area' },
    casual_sail:      { sentiment: 'avoid',   reason: 'USCG swim corridor — vessels prohibited in course area' },
  },
  'paddle': {
    kayak:            { sentiment: 'fun',     reason: 'Paddle event — join or cheer from the water' },
    sup:              { sentiment: 'fun',     reason: 'Paddle event — join or cheer from the water' },
    powerboat_cruise: { sentiment: 'caution', reason: 'Paddle event — many small craft in area, slow wake' },
    casual_sail:      { sentiment: 'caution', reason: 'Paddle event — many small craft in area' },
  },
  'dragon-boat': {
    kayak:            { sentiment: 'neutral', reason: 'Dragon boat racing in protected lagoon — no Bay impact' },
    sup:              { sentiment: 'neutral', reason: 'Dragon boat racing in protected lagoon — no Bay impact' },
    powerboat_cruise: { sentiment: 'neutral', reason: 'Dragon boat racing in protected lagoon — no Bay impact' },
    casual_sail:      { sentiment: 'neutral', reason: 'Dragon boat racing in protected lagoon — no Bay impact' },
  },
  'fishing': {
    kayak:            { sentiment: 'fun',     reason: 'Fishing event — kayak anglers welcome' },
    sup:              { sentiment: 'neutral', reason: 'Fishing event nearby' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Fishing derby — grab your rod' },
    casual_sail:      { sentiment: 'neutral', reason: 'Fishing event nearby' },
  },
  'heritage': {
    kayak:            { sentiment: 'fun',     reason: 'Maritime heritage event — paddle by for a look' },
    sup:              { sentiment: 'fun',     reason: 'Maritime heritage event — paddle by for a look' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Maritime heritage event — worth a visit' },
    casual_sail:      { sentiment: 'fun',     reason: 'Maritime heritage event — sail over' },
  },
  'youth': {
    kayak:            { sentiment: 'caution', reason: 'Youth regatta — many inexperienced sailors, give room' },
    sup:              { sentiment: 'caution', reason: 'Youth regatta — many small craft, stay clear' },
    powerboat_cruise: { sentiment: 'caution', reason: 'Youth regatta — slow wake, give room' },
    casual_sail:      { sentiment: 'neutral', reason: 'Youth regatta nearby' },
  },
  'community': {
    kayak:            { sentiment: 'fun',     reason: 'Community event — check it out' },
    sup:              { sentiment: 'fun',     reason: 'Community event — check it out' },
    powerboat_cruise: { sentiment: 'fun',     reason: 'Community event — worth a stop' },
    casual_sail:      { sentiment: 'fun',     reason: 'Community event — worth a stop' },
  },
};

// Override: events with major restricted zones escalate to 'avoid' for small craft
function applyRestrictionOverride(event: BayEvent, activity: ActivityType, base: { sentiment: EventSentiment; reason: string }): { sentiment: EventSentiment; reason: string } {
  if (event.restrictedZone === 'major' && (activity === 'kayak' || activity === 'sup')) {
    if (base.sentiment !== 'avoid') {
      return { sentiment: 'avoid', reason: `USCG restricted zone — ${event.trafficNote ?? 'avoid area during event'}` };
    }
  }
  return base;
}

/** Get events relevant to a specific trip context */
export function getEventsForTrip(month: number, activity: ActivityType): EventForTrip[] {
  const monthEvents = getEventsForMonth(month);
  const currentYear = new Date().getFullYear();

  return monthEvents
    .filter(event => {
      // Filter biennial events
      if (event.biennial === 'even' && currentYear % 2 !== 0) return false;
      if (event.biennial === 'odd' && currentYear % 2 !== 1) return false;
      return true;
    })
    .map(event => {
      const rule = RELEVANCE_RULES[event.category]?.[activity] ?? { sentiment: 'neutral' as EventSentiment, reason: '' };
      const { sentiment, reason } = applyRestrictionOverride(event, activity, rule);
      return { ...event, sentiment, reason };
    })
    // Sort: avoid first, then caution, then fun, then neutral
    .sort((a, b) => {
      const order: Record<EventSentiment, number> = { avoid: 0, caution: 1, fun: 2, neutral: 3 };
      return order[a.sentiment] - order[b.sentiment];
    });
}

/** Count events by sentiment for a quick summary */
export function eventSentimentSummary(events: EventForTrip[]): Record<EventSentiment, number> {
  const counts: Record<EventSentiment, number> = { fun: 0, caution: 0, avoid: 0, neutral: 0 };
  for (const e of events) counts[e.sentiment]++;
  return counts;
}
