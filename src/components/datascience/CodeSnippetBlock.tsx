'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, Trash2 } from 'lucide-react';
import { CodeSnippet } from '@/lib/types';

interface CodeSnippetBlockProps {
  snippet: CodeSnippet;
  onDelete: (id: string) => Promise<void>;
}

export const CodeSnippetBlock: React.FC<CodeSnippetBlockProps> = ({
  snippet: snip,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snip.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-muted flex flex-col justify-between space-y-3 hover:border-black/20 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#111111] text-[#E4FF6B]">
              <Code2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black text-[#111111]">{snip.title}</h4>
              <span className="badge badge-neutral text-[9px] uppercase">
                {snip.language}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-white hover:bg-[#EDEFEB] border border-black/5 text-[#111111] text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => onDelete(snip.id)}
              className="btn-icon-danger p-1.5"
              title="Hapus Snippet"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {snip.description && (
          <p className="text-xs text-[#7F847C] mb-2">{snip.description}</p>
        )}

        <div className="bg-[#111111] text-[#EDEFEB] p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed shadow-inner">
          <pre>{snip.code}</pre>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 pt-2 border-t border-black/5">
        {snip.tags.map((tag) => (
          <span key={tag} className="badge badge-neutral text-[9px]">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};
