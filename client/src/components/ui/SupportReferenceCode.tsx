import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SupportReferenceCodeProps {
  requestId?: string | null;
  className?: string;
}

export const SupportReferenceCode: React.FC<SupportReferenceCodeProps> = ({
  requestId,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!requestId) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortCode = requestId.slice(0, 8);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-highest/60 text-[11px] text-on-surface-variant font-mono ${className}`}
      title={`Support Correlation ID: ${requestId} (Click to copy)`}
    >
      <span>Ref: #{shortCode}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-0.5 rounded hover:bg-surface-container-high"
        aria-label="Copy reference ID"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
      {copied && <span className="text-[10px] text-emerald-600 font-sans">Copied!</span>}
    </div>
  );
};

