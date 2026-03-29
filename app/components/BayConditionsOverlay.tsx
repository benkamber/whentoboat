'use client';

import { useRef, useEffect, useCallback } from 'react';

// ============================================
// Animated Bay Conditions Overlay
//
// Canvas-based particle animation layered on the Mapbox map.
// Renders wind flow particles, tidal current arrows,
// wave height ripples, and fog opacity — all from live data.
//
// UX rules:
// - Fog suppresses wave ripples (can't see waves in fog)
// - Dense wind (>15kt) reduces wave opacity
// - Wave ripples only in exposed zones with significant waves
// - Respects prefers-reduced-motion
// ============================================

interface BayConditionsOverlayProps {
  mapRef: React.RefObject<any>;
  windSpeedKts: number;
  windDirDeg: number;
  windGustKts: number;
  waveHeightFt: number;
  wavePeriodS: number;
  waveDirDeg: number;
  visibilityMi: number;
  currentData: Record<string, { speed: number; direction: number; type?: 'flood' | 'ebb' | 'slack' }> | null;
  active: boolean;
}

// NOAA current station positions (approximate lat/lng)
const CURRENT_STATIONS: { id: string; name: string; lat: number; lng: number; zone: string }[] = [
  { id: 'SFB1201', name: 'Golden Gate', lat: 37.8083, lng: -122.4731, zone: 'central_bay' },
  { id: 'SFB1203', name: 'Alcatraz', lat: 37.8263, lng: -122.4227, zone: 'central_bay' },
  { id: 'SFB1205', name: 'Bay Bridge', lat: 37.8067, lng: -122.3566, zone: 'east_bay' },
  { id: 'PCT0261', name: 'Fort Point', lat: 37.8106, lng: -122.4770, zone: 'richardson' },
  { id: 'SFB1212', name: 'Raccoon Strait', lat: 37.8583, lng: -122.4467, zone: 'north_bay' },
];

// Wave ripple zones — only exposed open-water areas where waves matter.
// Each has a centroid and a minimum waveHeightFt threshold.
const WAVE_ZONES: { zone: string; lat: number; lng: number; minWaveHtFt: number }[] = [
  { zone: 'central_bay', lat: 37.815, lng: -122.42, minWaveHtFt: 0.5 },
  { zone: 'ocean_south', lat: 37.78, lng: -122.51, minWaveHtFt: 0.3 },
  { zone: 'ocean_north', lat: 37.84, lng: -122.52, minWaveHtFt: 0.3 },
  { zone: 'san_pablo', lat: 37.93, lng: -122.38, minWaveHtFt: 0.8 },
  // Sheltered zones (richardson, sf_shore, south_bay, east_bay) excluded —
  // waves are negligible in protected waters
];

// --- Particle system ---

interface Particle {
  lng: number;
  lat: number;
  age: number;
  maxAge: number;
  speed: number;
  size: number;
}

const MAX_PARTICLES = 350;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert meteorological wind direction (where wind comes FROM)
// to a motion vector (where wind goes TO) in screen space.
function windToScreenAngle(windDirDeg: number): number {
  return degToRad(windDirDeg + 90);
}

export function BayConditionsOverlay({
  mapRef,
  windSpeedKts,
  windDirDeg,
  windGustKts,
  waveHeightFt,
  wavePeriodS,
  waveDirDeg,
  visibilityMi,
  currentData,
  active,
}: BayConditionsOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  // Check reduced motion preference once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Project geo coords to screen pixels via the map
  const project = useCallback(
    (lng: number, lat: number): { x: number; y: number } | null => {
      const map = mapRef.current?.getMap?.();
      if (!map) return null;
      try {
        const pt = map.project([lng, lat]);
        return { x: pt.x, y: pt.y };
      } catch {
        return null;
      }
    },
    [mapRef]
  );

  // Initialize particle pool
  const initParticles = useCallback(
    (width: number, height: number) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;

      const count = Math.min(MAX_PARTICLES, Math.floor(80 + windSpeedKts * 15));
      const particles: Particle[] = [];

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      for (let i = 0; i < count; i++) {
        particles.push({
          lng: sw.lng + Math.random() * (ne.lng - sw.lng),
          lat: sw.lat + Math.random() * (ne.lat - sw.lat),
          age: Math.random() * 80,
          maxAge: 60 + Math.random() * 60,
          speed: 0.3 + Math.random() * 0.4,
          size: 1 + Math.random() * 1.5,
        });
      }
      particlesRef.current = particles;
    },
    [mapRef, windSpeedKts]
  );

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const map = mapRef.current?.getMap?.();
    if (!canvas || !map || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(width, height);
    }

    const time = timeRef.current++;
    ctx.clearRect(0, 0, width, height);

    const isFoggy = visibilityMi < 5;
    const isWindy = windSpeedKts > 15;

    // --- 1. FOG OVERLAY ---
    if (visibilityMi < 8) {
      const fogOpacity = Math.min(0.45, Math.max(0, (8 - visibilityMi) / 8) * 0.45);
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) * 0.8;

      const fogGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      fogGrad.addColorStop(0, `rgba(200, 210, 220, ${fogOpacity})`);
      fogGrad.addColorStop(0.5, `rgba(180, 195, 210, ${fogOpacity * 0.7})`);
      fogGrad.addColorStop(1, `rgba(160, 175, 195, ${fogOpacity * 0.2})`);

      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);

      // Fog wisps — skip if reduced motion
      if (!prefersReducedMotion.current) {
        const wispCount = Math.floor((8 - visibilityMi) * 3);
        for (let i = 0; i < wispCount; i++) {
          const phase = time * 0.005 + i * 1.7;
          const wx = (width * 0.2) + (width * 0.6) * ((Math.sin(phase * 0.3 + i) + 1) / 2);
          const wy = (height * 0.2) + (height * 0.6) * ((Math.cos(phase * 0.2 + i * 0.7) + 1) / 2);
          const wr = 60 + Math.sin(phase) * 30;
          const wispGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
          wispGrad.addColorStop(0, `rgba(220, 225, 235, ${fogOpacity * 0.3})`);
          wispGrad.addColorStop(1, 'rgba(220, 225, 235, 0)');
          ctx.fillStyle = wispGrad;
          ctx.beginPath();
          ctx.arc(wx, wy, wr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- 2. WIND PARTICLES (skip if reduced motion) ---
    if (!prefersReducedMotion.current) {
      const windAngle = windToScreenAngle(windDirDeg);
      const windMag = Math.max(0.5, windSpeedKts * 0.12);
      const gustFactor = windGustKts > 0 ? windGustKts / Math.max(windSpeedKts, 1) : 1;

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      for (const p of particlesRef.current) {
        p.age++;

        if (p.age > p.maxAge) {
          p.lng = sw.lng + Math.random() * (ne.lng - sw.lng);
          p.lat = sw.lat + Math.random() * (ne.lat - sw.lat);
          p.age = 0;
          p.maxAge = 60 + Math.random() * 60;
          p.speed = 0.3 + Math.random() * 0.4;
        }

        const pt = project(p.lng, p.lat);
        if (!pt) continue;

        const gustBurst = Math.sin(time * 0.1 + p.lng * 100) > 0.7 ? gustFactor : 1;
        const dx = Math.cos(windAngle) * windMag * p.speed * gustBurst;
        const dy = Math.sin(windAngle) * windMag * p.speed * gustBurst;

        const newPt = map.unproject([pt.x + dx, pt.y + dy]);
        p.lng = newPt.lng;
        p.lat = newPt.lat;

        const screenPt = project(p.lng, p.lat);
        if (!screenPt || screenPt.x < -20 || screenPt.x > width + 20 ||
            screenPt.y < -20 || screenPt.y > height + 20) {
          p.age = p.maxAge;
          continue;
        }

        const lifeFrac = p.age / p.maxAge;
        const fadeIn = Math.min(1, lifeFrac * 5);
        const fadeOut = Math.max(0, 1 - (lifeFrac - 0.7) / 0.3);
        const alpha = Math.min(fadeIn, fadeOut) * 0.6;

        if (alpha <= 0) continue;

        const intensity = Math.min(1, windSpeedKts / 20);
        const r = Math.floor(200 + intensity * 55);
        const g = Math.floor(220 + intensity * 35);
        const b = 255;

        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        if (windSpeedKts > 8) {
          ctx.beginPath();
          ctx.arc(screenPt.x, screenPt.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
          ctx.fill();
        }
      }
    }

    // --- 3. TIDAL CURRENT ARROWS ---
    if (currentData) {
      for (const station of CURRENT_STATIONS) {
        const current = currentData[station.zone];
        if (!current || current.speed <= 0) continue;

        const pt = project(station.lng, station.lat);
        if (!pt) continue;
        if (pt.x < -50 || pt.x > width + 50 || pt.y < -50 || pt.y > height + 50) continue;

        const speed = current.speed;
        const dir = degToRad(current.direction);

        // Use actual flood/ebb type from NOAA, not direction heuristic
        const isEbb = current.type === 'ebb';
        const isSlack = current.type === 'slack';

        if (isSlack) continue; // Don't draw arrows at slack

        const arrowLen = Math.min(80, 20 + speed * 15);
        const numChevrons = Math.max(2, Math.floor(speed * 2));

        // Animated chevron offset — skip animation if reduced motion
        const flowOffset = prefersReducedMotion.current
          ? 0
          : (time * speed * 0.15) % (arrowLen / numChevrons);

        // Cyan-teal for flood (incoming), amber for ebb (outgoing)
        const baseAlpha = Math.min(0.8, 0.3 + speed * 0.15);
        const color = isEbb
          ? `rgba(245, 158, 11, ${baseAlpha})`
          : `rgba(20, 184, 166, ${baseAlpha})`;

        const glowAlpha = Math.min(0.3, speed * 0.06);
        const glowColor = isEbb
          ? `rgba(245, 158, 11, ${glowAlpha})`
          : `rgba(20, 184, 166, ${glowAlpha})`;

        // Glow behind arrow path
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x - Math.cos(dir) * arrowLen * 0.5, pt.y - Math.sin(dir) * arrowLen * 0.5);
        ctx.lineTo(pt.x + Math.cos(dir) * arrowLen * 0.5, pt.y + Math.sin(dir) * arrowLen * 0.5);
        ctx.stroke();

        // Animated chevrons
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const spacing = arrowLen / numChevrons;
        for (let i = 0; i < numChevrons + 1; i++) {
          const offset = -arrowLen * 0.5 + i * spacing + flowOffset;
          const cx = pt.x + Math.cos(dir) * offset;
          const cy = pt.y + Math.sin(dir) * offset;

          const edgeFade = 1 - Math.abs(offset) / (arrowLen * 0.6);
          if (edgeFade <= 0) continue;

          const chevSize = 6 + speed * 2;
          const perpDir = dir + Math.PI / 2;

          ctx.globalAlpha = edgeFade;
          ctx.beginPath();
          ctx.moveTo(
            cx - Math.cos(dir) * chevSize * 0.5 + Math.cos(perpDir) * chevSize * 0.4,
            cy - Math.sin(dir) * chevSize * 0.5 + Math.sin(perpDir) * chevSize * 0.4
          );
          ctx.lineTo(cx, cy);
          ctx.lineTo(
            cx - Math.cos(dir) * chevSize * 0.5 - Math.cos(perpDir) * chevSize * 0.4,
            cy - Math.sin(dir) * chevSize * 0.5 - Math.sin(perpDir) * chevSize * 0.4
          );
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // --- 4. WAVE RIPPLES ---
    // Suppressed when foggy (can't see waves in fog) or reduced motion
    if (!isFoggy && !prefersReducedMotion.current && waveHeightFt > 0.3) {
      const waveIntensity = Math.min(1, waveHeightFt / 4);
      // Reduce wave opacity when very windy — wind particles already dominate
      const windDampen = isWindy ? 0.5 : 1;
      const period = Math.max(2, wavePeriodS || 4);
      const waveAngle = degToRad(waveDirDeg || windDirDeg);

      for (const waveZone of WAVE_ZONES) {
        // Only show ripples where waves exceed zone threshold
        if (waveHeightFt < waveZone.minWaveHtFt) continue;

        const pt = project(waveZone.lng, waveZone.lat);
        if (!pt) continue;
        if (pt.x < -100 || pt.x > width + 100 || pt.y < -100 || pt.y > height + 100) continue;

        const numRings = Math.min(4, Math.floor(1 + waveHeightFt));
        for (let ring = 0; ring < numRings; ring++) {
          const phase = (time * 0.03 / period + ring * 0.3) % 1;
          const radius = 15 + phase * 50 * (1 + waveIntensity);
          const alpha = (1 - phase) * waveIntensity * 0.25 * windDampen;

          if (alpha <= 0.02) continue;

          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(waveAngle);
          ctx.scale(1.4, 0.7);

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
          ctx.lineWidth = 1.5 + waveIntensity;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    frameRef.current = requestAnimationFrame(animate);
  }, [
    active, windSpeedKts, windDirDeg, windGustKts,
    waveHeightFt, wavePeriodS, waveDirDeg,
    visibilityMi, currentData, project, initParticles, mapRef,
  ]);

  // Start/stop animation
  useEffect(() => {
    if (!active) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      initParticles(canvas.clientWidth, canvas.clientHeight);
    }

    // Reduced motion: render one static frame (fog + arrows only), then stop
    if (prefersReducedMotion.current) {
      frameRef.current = requestAnimationFrame(() => {
        animate();
        // Don't loop — single frame
      });
      return;
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, animate, initParticles]);

  // Re-init particles when map moves
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !active) return;

    const handleMove = () => {
      const canvas = canvasRef.current;
      if (canvas) initParticles(canvas.clientWidth, canvas.clientHeight);
    };

    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);
    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, [mapRef, active, initParticles]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
