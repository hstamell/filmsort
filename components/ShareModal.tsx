'use client';

import { useState } from 'react';

interface ShareModalProps {
  shareText: string;
  onClose: () => void;
}

export default function ShareModal({ shareText, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--border-light)' }}
      >
        <h3
          className="text-xl font-bold text-center mb-4"
          style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--gold)' }}
        >
          Share Your Results
        </h3>

        <pre
          className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed mb-4 text-center"
          style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          {shareText}
        </pre>

        <button
          onClick={handleCopy}
          className="btn-gold w-full py-3 font-bold rounded-xl transition-all mb-3"
          style={{ color: 'var(--bg)', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
