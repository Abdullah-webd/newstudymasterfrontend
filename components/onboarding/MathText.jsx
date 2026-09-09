'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * The scraped question bank stores maths in three inconsistent ways:
 *   1. LaTeX delimiters  \(...\)  and  \[...\]     (e.g. matrix/array questions)
 *   2. bare LaTeX with NO delimiters               (e.g. "\sqrt{2}(\sqrt{6}...)")
 *   3. proper $...$ / $$...$$
 * remark-math only understands $, so (1) and (2) render as raw source.
 *
 * normalizeMath() converts everything to $-delimited maths so KaTeX renders it,
 * WITHOUT wrapping plain English words (so "Simplify;" stays text while the
 * expression after it becomes maths).
 */

// One maths token: a LaTeX command (+ its braced/bracketed args), a super/sub-
// script, a braced group, a number, a *single* letter (a variable — not a word),
// or a maths operator/paren.
const TOKEN =
  '(?:\\\\[a-zA-Z]+\\*?(?:\\{[^{}]*\\}|\\[[^\\]]*\\])*' + // \sqrt{2}, \frac{a}{b}, \begin{array}
  '|\\^\\{[^{}]*\\}|\\^[A-Za-z0-9]' + // ^{...}  or  ^2
  '|_\\{[^{}]*\\}|_[A-Za-z0-9]' + // _{...}  or  _1
  '|\\{[^{}]*\\}' + // { ... }
  '|\\d+(?:\\.\\d+)?' + // numbers
  '|(?<![A-Za-z])[A-Za-z](?![A-Za-z])' + // a lone variable letter, not inside a word
  '|[()+\\-*/=.,|<>])'; // operators / brackets

const MATH_RUN = new RegExp(`(?:${TOKEN})(?:[ \\t]*(?:${TOKEN}))*`, 'g');

export function normalizeMath(input) {
  let s = (input == null ? '' : String(input));
  if (!s) return '';

  // 1) Standard LaTeX delimiters -> $ / $$
  s = s.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  s = s.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // Already contains $ delimiters -> trust them.
  if (s.includes('$')) return s;

  // No LaTeX-ish content at all -> return untouched.
  if (!/[\\^_]/.test(s)) return s;

  // 2) Bare LaTeX: wrap contiguous maths runs, leave prose alone.
  return s.replace(MATH_RUN, (m) => {
    const trimmed = m.trim();
    // Only wrap runs that actually carry a LaTeX command or a super/subscript.
    if (trimmed && /[\\^_]/.test(trimmed)) return `$${trimmed}$`;
    return m;
  });
}

export default function MathText({ children, className = '' }) {
  const content = normalizeMath(children);
  return (
    <span className={`mathtext ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({ node, ...props }) => <span {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
}
