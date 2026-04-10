'use client';

import { useState } from 'react';

interface ShareActionsProps {
  url: string;
  title: string;
  description: string;
}

export function ShareActions({ url, title, description }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\nView trip: ${url}\n\nPlanned with WhenToBoat — free boating planner for SF Bay`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url });
    } catch {
      // User cancelled or share failed — no action needed
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={handleCopyLink}
        className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-safety-blue hover:text-safety-blue transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button
        onClick={handleEmail}
        className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-safety-blue hover:text-safety-blue transition-colors"
      >
        Email
      </button>
      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-safety-blue hover:text-safety-blue transition-colors"
        >
          Share
        </button>
      )}
    </div>
  );
}
