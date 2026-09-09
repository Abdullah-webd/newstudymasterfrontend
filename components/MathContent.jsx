'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// The proven math renderer (same engine as the notes canvas): deterministic
// KaTeX rendering that handles $...$, $$...$$, \(...\), \[...\], BARE LaTeX
// (\frac{..}, x^2 ...) and recovers control-chars from old JSON corruption.

function recoverLatex(s) {
  return (s == null ? '' : String(s))
    .replace(/\f/g, '\\f').replace(/\t/g, '\\t').replace(/\x0b/g, '\\v')
    .replace(/\x08/g, '\\b').replace(/\r/g, '\\r')
}

function katexHtml(tex, display) {
  try { return katex.renderToString(tex.trim(), { throwOnError: false, displayMode: display }) }
  catch (e) { return display ? `$$${tex}$$` : `$${tex}$` }
}

// Wrap bare LaTeX runs (no delimiters) in $...$ — mirrors the backend normalizer.
const TOKEN =
  '(?:\\\\[a-zA-Z]+\\*?(?:\\{[^{}]*\\}|\\[[^\\]]*\\])*' +
  '|\\^\\{[^{}]*\\}|\\^[A-Za-z0-9]' +
  '|_\\{[^{}]*\\}|_[A-Za-z0-9]' +
  '|\\{[^{}]*\\}' +
  '|\\d+(?:\\.\\d+)?' +
  '|(?<![A-Za-z])[A-Za-z](?![A-Za-z])' +
  '|[()+\\-*/=.,|<>])'
const MATH_RUN = new RegExp(`(?:${TOKEN})(?:[ \\t]*(?:${TOKEN}))*`, 'g')

function wrapBareLatex(s) {
  if (s.includes('$')) return s
  if (!/[\\^_]/.test(s)) return s
  return s.replace(MATH_RUN, (m) => {
    const t = m.trim()
    return t && /[\\^_]/.test(t) ? `$${t}$` : m
  })
}

/**
 * Normalise maths to `$`/`$$` delimiters WITHOUT rendering, so markdown (which
 * only understands `$`) can still show `\(..\)`, `\[..\]` and bare LaTeX.
 * Markdown-safe: never touches code spans/fences or already-delimited maths, and
 * only wraps runs containing a real `\command` — so `_italics_` stay italics.
 */
export function normalizeMathForMarkdown(text) {
  if (text == null || text === '') return ''
  let out = recoverLatex(String(text))
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => `$$${tex}$$`)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => `$${tex}$`)
  // Split off regions that must be left exactly as-is.
  const parts = out.split(/(```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part // protected region
      if (!part.includes('\\')) return part
      return part.replace(MATH_RUN, (m) => {
        const t = m.trim()
        if (!t || !/\\[a-zA-Z]/.test(t)) return m
        // Sentence punctuation belongs to the prose, not inside the maths.
        const tail = t.match(/[,.;:]+$/)
        const core = tail ? t.slice(0, -tail[0].length) : t
        return core ? `$${core}$${tail ? tail[0] : ''}` : m
      })
    })
    .join('')
}

export function renderMathHtml(text) {
  if (text == null || text === '') return ''
  let out = recoverLatex(String(text))
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => `$$${tex}$$`)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => `$${tex}$`)
  out = wrapBareLatex(out)
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => katexHtml(tex, true))
  out = out.replace(/\$([^$\n]+?)\$/g, (_, tex) => katexHtml(tex, false))
  return out
}

/** Inline text that may contain maths in any of the bank's formats. */
export default function MathContent({ children, className = '' }) {
  const html = useMemo(() => renderMathHtml(children), [children])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
