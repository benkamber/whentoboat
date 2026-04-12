# Risk Remediation Plan — Partner & Operational Risks

Based on Sea Trek owner persona feedback, April 2026.

## Risk 1: Liability Transfer to Partners

**Risk:** If WhenToBoat says "Looks good" and a customer gets hurt during a Sea Trek tour, Sea Trek's counsel could argue WhenToBoat's assessment influenced the decision to launch.

**Remediation:**
- [ ] Every conditions display includes: "Planning guidance only. Not a safety assessment. The operator is solely responsible for go/no-go decisions."
- [ ] Partner embed widget includes explicit disclaimer: "[Partner Name] uses WhenToBoat for conditions reference. All safety decisions are made by [Partner Name]'s professional guides."
- [ ] Terms of Service (already updated) explicitly disclaims liability for reliance on the service
- [ ] E&O insurance in place before any partner outreach (~$1,000/yr)
- [ ] Maritime attorney review of partner-facing language (schedule this week)
- [ ] Partner agreement template that indemnifies WhenToBoat and clarifies the operator retains full safety authority

**Status:** TOS updated. Insurance and attorney consultation needed.

## Risk 2: Forecast Accuracy Undermining Trust

**Risk:** App shows 4kt, reality is 12kt. Both WhenToBoat and the partner lose credibility.

**Remediation:**
- [x] Conservative bias built into scoring (HRRR underpredicts by 4-6kt — thresholds account for this)
- [x] Wind shown as ranges, not point forecasts
- [x] "Forecast conditions — actual conditions can change rapidly" disclaimer on every screen
- [ ] Add "Accuracy feedback" button: after each outing, user rates "Better / About right / Worse than forecast" — builds calibration data over time
- [ ] Investigate WeatherFlow mesonet stations for real-time observation cross-referencing
- [ ] Display divergence when available: "Forecast 8kt but station reading 14kt"

**Status:** Scoring bias and disclaimers done. Feedback mechanism and WeatherFlow integration pending.

## Risk 3: Channel Conflict — Customers Skipping Partners

**Risk:** WhenToBoat makes customers confident enough to paddle without a guide, reducing Sea Trek bookings.

**Remediation:**
- [ ] Partner links prominently feature "Book with [Partner]" buttons — WhenToBoat drives bookings TO partners, not away from them
- [ ] Rental/guide links already exist in destination data (`rentalLinks` field on destinations) — make them more prominent
- [ ] Partner widget includes booking CTA as the primary action
- [ ] Content guides (e.g., "Best Kayak Trips from Sausalito") recommend guided tours for beginners
- [ ] Position WhenToBoat as the "pre-trip research" tool that drives informed customers to partners, not a replacement for professional guidance

**Status:** Rental links exist in data. Partner booking integration pending.

## Risk 4: Partner Wants Conditions for THEIR Specific Launch Site

**Risk:** Generic "Richardson Bay" conditions aren't specific enough for Schoonmaker Point vs. Horseshoe Bay.

**Remediation:**
- [x] 38 destinations include specific launch points (Schoonmaker Point is destination 'skm')
- [ ] Partner embed widget can be configured with a specific destination ID
- [ ] Synthetic bookmark links encode origin + activity for partner-specific URLs
- [ ] Consider adding micro-location conditions notes per destination

**Status:** Data exists. Widget configuration and synthetic links needed.

## Risk 5: Partner Wants Pre-Trip Customer Communication

**Risk/Opportunity:** Partners want automated pre-trip emails to booked customers showing conditions.

**Remediation:**
- [ ] Build a "conditions briefing" shareable link: `/briefing?origin=skm&activity=kayak&date=2026-04-15`
- [ ] Partners can include this link in their booking confirmation emails
- [ ] Page shows: conditions for that date (if within forecast window) or historical patterns (if further out)
- [ ] Includes gear recommendations based on water temp
- [ ] Branded with partner name if embed parameter provided

**Status:** Not yet built. High-value feature for partner acquisition.

## Risk 6: Partner Doesn't Want to Send Customers Away

**Risk:** Partners want conditions data ON their site, not a link to WhenToBoat.

**Remediation:**
- [ ] Build embeddable widget (iframe) configurable per partner
- [ ] Widget shows conditions for partner's specific location + activity
- [ ] Optional "Book Now" button linking to partner's booking page
- [ ] Free tier: "Powered by WhenToBoat" branding
- [ ] Paid tier: white-label, no WhenToBoat branding ($50-200/mo)

**Status:** Widget not yet built. This is the #1 B2B feature.

## Priority Order

1. **Synthetic bookmark links + partner embed URLs** (this session)
2. **E&O insurance** (this week — manual step)
3. **Maritime attorney consultation** (this week — manual step)
4. **Accuracy feedback mechanism** (next build session)
5. **Embeddable widget** (next build session)
6. **Pre-trip briefing page** (after partner validation)
