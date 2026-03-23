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
    } catch {
      // Fallback: select the text
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white text-xl font-bold text-center mb-4">Share Your Results</h3>

        <pre className="bg-zinc-900 rounded-xl p-4 text-sm text-white whitespace-pre-wrap font-mono leading-relaxed mb-4 text-center">
          {shareText}
        </pre>

        <button
          onClick={handleCopy}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold rounded-xl transition-colors mb-3"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
