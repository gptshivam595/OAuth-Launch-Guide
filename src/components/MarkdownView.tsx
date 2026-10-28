import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 my-2 pl-4 list-disc list-outside text-[#D1E7DD]/90">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    // Regex for bold **text**, code `text`, italic *text*, links [text](url)
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let tokenKey = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code
            key={`code-${tokenKey++}`}
            className="rounded bg-[#060B09] px-1.5 py-0.5 font-mono text-[11px] text-[#00F29D] border border-[#1B382B]"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push(
          <strong key={`bold-${tokenKey++}`} className="font-semibold text-white">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        tokens.push(
          <em key={`italic-${tokenKey++}`} className="italic text-[#D1E7DD]/80">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={`link-${tokenKey++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00E5FF] hover:text-[#00F29D] underline font-medium transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain char
      const nextSpecial = remaining.search(/[`*[]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Unmatched marker, consume 1 char
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`flush-${idx}`);
      return;
    }

    // List item (either - or * or •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      inList = true;
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      listItems.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {formatInline(itemText)}
        </li>
      );
      return;
    }

    // Heading 3 or 2
    if (trimmed.startsWith('### ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h4 key={`h-${idx}`} className="text-xs font-bold uppercase tracking-wider text-[#00F29D] font-mono mt-3 mb-1">
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h3 key={`h-${idx}`} className="text-sm font-bold text-white font-['Space_Grotesk'] mt-4 mb-1">
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }

    // Normal paragraph
    flushList(`flush-${idx}`);
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed my-1.5 text-[#D1E7DD]/90 text-xs">
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList('flush-final');

  return <div className={`text-xs space-y-1 ${className}`}>{elements}</div>;
};
