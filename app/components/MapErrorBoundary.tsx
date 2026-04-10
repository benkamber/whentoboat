'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for the map component.
 * If Mapbox GL crashes (WebGL context loss, bad token, network error),
 * shows a helpful fallback instead of a white screen.
 *
 * SAFETY-CRITICAL: A white screen could be interpreted as "no warnings"
 * by a boater checking conditions before departure. The sidebar with
 * scores and risk factors must remain accessible even when the map fails.
 */
export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MapErrorBoundary] Map component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? '';
      const isTokenError = /401|403|access token|not authorized/i.test(msg);
      return (
        <div className="flex-1 flex items-center justify-center bg-ocean-950 text-ocean-300 p-8">
          <div className="text-center max-w-md space-y-3">
            <div className="text-4xl">🗺️</div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Map unavailable</h2>
            <p className="text-sm">
              {isTokenError
                ? 'The Mapbox access token is missing or invalid. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.'
                : 'The map could not be loaded. Scores and destination recommendations in the sidebar are still accurate and up-to-date.'}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {msg || 'Unknown error'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
