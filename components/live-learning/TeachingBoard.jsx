'use client'

// The teaching board is a blank sheet, not a dashboard.
//
// Everything StudyMaster writes lands in one flowing column of plain text, the way a
// teacher fills a whiteboard top to bottom. No cards, no tinted panels, no
// grid — those made the board read as a UI instead of a lesson, and they broke
// the reading order when two items sat side by side.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { recoverLatex } from '@/components/MathContent'

/** Display maths, centred on its own line like a teacher would write it. */
function Formula({ latex }) {
  const html = useMemo(() => {
    try { return katex.renderToString(cleanBoardText(latex).replace(/^\$+|\$+$/g, ''), { throwOnError: false, displayMode: true }) }
    catch { return latex || '' }
  }, [latex])
  return <div className="lb-formula" dangerouslySetInnerHTML={{ __html: html }} />
}

/** Prose that may contain maths in ANY of the forms the model emits.
 *  It writes \(…\), \[…\] and $…$ interchangeably, so all three are
 *  normalised before rendering — otherwise the raw delimiters show up on the
 *  board as literal text, which is exactly what students were seeing. */
// Models sometimes over-escape LaTeX in JSON, sending "\\log" for "\log". In
// KaTeX "\\" is a LINE BREAK, so "log₂8" split across lines with "log" in
// italics. Collapse the double backslash only before real commands, so a
// genuine line break (e.g. "...N\\\log_b") is left alone.
const OVER_ESCAPED = /(?<!\\)\\\\(?=(?:log|ln|lg|sin|cos|tan|sec|csc|cot|frac|dfrac|sqrt|text|mathrm|times|div|cdot|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|Delta|left|right|rightarrow|leftarrow|to|ne|neq|le|leq|ge|geq|approx|infty|sum|int|degree|circ|pm)(?![a-zA-Z]))/g

// Model text arrives through JSON, where "\frac" can decode to a form-feed +
// "rac" and stray control characters (we saw "$\u0002\log_2 8$") break
// KaTeX into red error text. Repair those, then close an unbalanced "$" so a
// trailing "$N>0." is rendered instead of leaking a dollar sign.
export function cleanBoardText(raw) {
  let out = recoverLatex(String(raw ?? '')).replace(/[\u0000-\u0007\u000e-\u001f]/g, '').replace(OVER_ESCAPED, '\\')
  const dollars = (out.replace(/\\\$/g, '').match(/\$/g) || []).length
  if (dollars % 2 === 1) out = out.replace(/([.,;:!?]*)\s*$/, '$$$1')
  return out
}

export function renderMaths(raw) {
  let out = cleanBoardText(raw)
  const blocks = []
  const stash = (tex, display) => {
    try { blocks.push(katex.renderToString(tex.trim(), { throwOnError: false, displayMode: display })) }
    catch { blocks.push(tex) }
    return `\u0000${blocks.length - 1}\u0000`
  }
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => stash(tex, true))
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => stash(tex, false))
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => stash(tex, true))
  out = out.replace(/\$([^$\n]+?)\$/g, (_, tex) => stash(tex, false))
  // The model also emits bare LaTeX with NO delimiters at all — \times,
  // \text{H}_2\text{O}, H_2O. Those were leaking onto the board as literal
  // source. Wrap any run containing a real \command or a sub/superscript.
  if (!/\u0000/.test(out) || true) {
    const TOKEN = '(?:\\\\[a-zA-Z]+\\*?(?:\\{[^{}]*\\})*' +
                  '|\\^\\{[^{}]*\\}|\\^[A-Za-z0-9]' +
                  '|_\\{[^{}]*\\}|_[A-Za-z0-9]' +
                  '|\\{[^{}]*\\}' +
                  '|\\d+(?:\\.\\d+)?' +
                  '|(?<![A-Za-z])[A-Za-z](?![A-Za-z])' +
                  '|[()+\\-*/=.,])'
    const RUN = new RegExp(`(?:${TOKEN})(?:[ \\t]*(?:${TOKEN}))*`, 'g')
    out = out.replace(RUN, (m) => {
      const t = m.trim()
      if (!t || !/\\[a-zA-Z]|[_^]/.test(t)) return m
      const tail = t.match(/[,.;:]+$/)
      const core = tail ? t.slice(0, -tail[0].length) : t
      if (!core) return m
      try {
        const rendered = katex.renderToString(core, { throwOnError: false, displayMode: false })
        blocks.push(rendered)
        return `\u0000${blocks.length - 1}\u0000${tail ? tail[0] : ''}`
      } catch { return m }
    })
  }

  if (!blocks.length) return null
  // escape the surrounding prose, then drop the rendered maths back in
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)])
}

function Prose({ text, className = '', as: Tag = 'p' }) {
  const html = useMemo(() => renderMaths(text), [text])
  if (html === null) return <Tag className={className}>{text}</Tag>
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}


/** A question the student answers by tapping. Wrong options are real mistakes,
 *  and each one explains itself once chosen — being wrong is where the
 *  learning happens. A wrong pick can be retried (the tried option stays
 *  marked); the question locks once they find the right one. */
function Quiz({ content, onAnswer }) {
  const [tried, setTried] = useState([])
  const options = Array.isArray(content.options) ? content.options : []
  const correct = Number.isFinite(content.correctIndex) ? content.correctIndex : 0
  const explanations = Array.isArray(content.explanations) ? content.explanations : []
  const last = tried.length ? tried[tried.length - 1] : null
  const solved = tried.includes(correct)

  const pick = (i) => {
    if (solved || tried.includes(i)) return
    const next = [...tried, i]
    setTried(next)
    onAnswer?.(content, i)
  }

  return (
    <div className="lb-quiz">
      <Prose text={content.question} className="lb-quiz-q" />
      <ul className="lb-quiz-options">
        {options.map((option, i) => {
          const isRight = i === correct
          const wasTried = tried.includes(i)
          const state = solved
            ? (isRight ? 'is-right' : wasTried ? 'is-wrong' : 'is-dim')
            : (wasTried ? 'is-wrong' : '')
          return (
            <li key={i}>
              <button
                type="button"
                className={`lb-quiz-option ${state}`}
                onClick={() => pick(i)}
                disabled={solved || wasTried}
                aria-pressed={wasTried}
              >
                <span className="lb-quiz-letter">{String.fromCharCode(65 + i)}</span>
                <Prose as="span" text={option} />
                {solved && isRight && <Check size={15} aria-label="correct" />}
                {wasTried && !isRight && <X size={15} aria-label="incorrect" />}
              </button>
            </li>
          )
        })}
      </ul>
      {last !== null && (
        <Prose
          className={`lb-quiz-why ${last === correct ? 'is-right' : 'is-wrong'}`}
          text={(explanations[last] || (last === correct ? 'That is right.' : 'Not quite — have another look.'))
            + (last !== correct && !solved ? ' Try again.' : '')}
        />
      )}
    </div>
  )
}

/** A real picture (Wikipedia / Wikimedia Commons), credited like a textbook figure. */
function Picture({ content }) {
  const [failed, setFailed] = useState(false)
  if (!content.url || failed) return null
  return (
    <figure className="lb-image">
      <img src={content.url} alt={content.caption || content.title || ''} loading="eager" onError={() => setFailed(true)} />
      {(content.caption || content.source) && (
        <figcaption>
          {content.caption}
          {content.source && <> · <a href={content.source} target="_blank" rel="noreferrer">{content.license || 'Wikimedia'}</a></>}
        </figcaption>
      )}
    </figure>
  )
}

function Line({ operation, onQuizAnswer }) {
  const c = operation.content || {}

  switch (operation.action) {
    case 'set_focus':
      return (
        <header className="lb-focus">
          <h2>{c.title}</h2>
          {c.objective && <Prose text={c.objective} className="lb-objective" />}
        </header>
      )

    case 'write_heading':
    case 'new_page':
      return <h3 className="lb-heading"><Prose as="span" text={c.text || c.title} /></h3>

    case 'write_formula':
      return (
        <div className="lb-block">
          {c.label && <Prose text={c.label} className="lb-lead" />}
          <Formula latex={c.latex} />
          {c.explanation && <Prose text={c.explanation} />}
        </div>
      )

    case 'write_steps':
      return (
        <div className="lb-block">
          {c.title && <Prose text={c.title} className="lb-lead" />}
          <ol className="lb-steps">
            {(c.steps || []).map((step, i) => <li key={i}><Prose text={step} /></li>)}
          </ol>
        </div>
      )

    case 'show_example':
      return (
        <div className="lb-block">
          <Prose text={c.problem} className="lb-lead" />
          <ol className="lb-steps">
            {(c.solution || []).map((step, i) => <li key={i}><Prose text={step} /></li>)}
          </ol>
        </div>
      )

    case 'show_question':
      if (Array.isArray(c.options) && c.options.length >= 2) return <Quiz content={c} onAnswer={onQuizAnswer} />
      return (
        <div className="lb-block lb-ask">
          <Prose text={c.question} className="lb-lead" />
          {c.hint && <Prose text={`Hint: ${c.hint}`} className="lb-hint" />}
        </div>
      )

    case 'show_image':
      return <Picture content={c} />

    case 'highlight_item':
      return <p className="lb-underline">{c.note}</p>

    default:
      return <Prose text={c.text} className={c.emphasis === 'key' ? 'lb-key' : ''} />
  }
}

export default function TeachingBoard({ operations, topic, preparing, connecting = false, stepIndex = 0, roadmap = [], onQuizAnswer, focusId = null, trackLabel = 'Step', onPickStep }) {
  const scrollerRef = useRef(null)
  const endRef = useRef(null)
  // The board shows ONE roadmap step at a time, the way a teacher wipes the
  // whiteboard between topics. Nothing is lost — every line is kept in the
  // lesson notes — but the student is never asked to scroll a wall of text.
  const visible = operations.filter((op) => op.action !== 'clear_board')
  const lastClear = operations.map((op) => op.action).lastIndexOf('clear_board')
  const afterClear = lastClear >= 0
    ? visible.filter((op) => op.revision > operations[lastClear].revision)
    : visible
  const hasSteps = roadmap.length > 0
  const board = hasSteps
    ? afterClear.filter((op) => (op.stepIndex ?? 0) === stepIndex)
    : afterClear
  const current = hasSteps ? roadmap[stepIndex] : null

  // Keep the newest line in view and clear of the teacher and caption at the
  // bottom. Without this the board writes underneath them and the student has
  // to scroll to read what was just written.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || board.length === 0) return
    const entries = scroller.querySelectorAll('.lb-entry')
    const last = entries[entries.length - 1]
    if (!last) return

    // The teacher and her caption float over the bottom of the sheet. Scroll so
    // the newest line lands ABOVE them — scrolling simply to the end would put
    // it behind the caption, which is what made the board look overwritten.
    const floating = scroller.ownerDocument.querySelector('.live-caption')
      || scroller.ownerDocument.querySelector('.live-teacher-zone')
    const scrollerRect = scroller.getBoundingClientRect()
    const deadZone = floating
      ? Math.max(0, scrollerRect.bottom - floating.getBoundingClientRect().top) + 24
      : 160

    const target = scrollerRect.top + scroller.clientHeight - deadZone
    const delta = last.getBoundingClientRect().bottom - target
    if (delta <= 0) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: reduce ? 'auto' : 'smooth' })
  }, [board.length])

  // Keep the paragraph she is teaching in view (above the floating teacher/caption).
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || !focusId) return
    const el = scroller.querySelector(`[data-op-id="${focusId}"]`)
    if (!el) return
    const floating = scroller.ownerDocument.querySelector('.live-caption') || scroller.ownerDocument.querySelector('.live-teacher-zone')
    const box = scroller.getBoundingClientRect()
    const dead = floating ? Math.max(0, box.bottom - floating.getBoundingClientRect().top) + 24 : 160
    const r = el.getBoundingClientRect()
    const top = box.top + 110          // below the sticky page track
    const bottom = box.bottom - dead
    if (r.top >= top && r.bottom <= bottom) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({ top: scroller.scrollTop + (r.top - top) - 12, behavior: reduce ? 'auto' : 'smooth' })
  }, [focusId, stepIndex])

  // a new page starts at its top
  useEffect(() => { scrollerRef.current?.scrollTo({ top: 0 }) }, [stepIndex])

  return (
    <div className="live-board" ref={scrollerRef} aria-live="polite">
      {hasSteps && (
        <div className="lb-plan">
          <ol className="lb-plan-track">
            {roadmap.map((step, i) => (
              <li
                key={step.title + i}
                className={`${i === stepIndex ? 'is-active' : step.status === 'done' ? 'is-done' : ''}${onPickStep ? ' is-pickable' : ''}`}
                title={step.title}
                onClick={onPickStep ? () => onPickStep(i) : undefined}
              >
                <i />
                <span>{step.title}</span>
              </li>
            ))}
          </ol>
          <p className="lb-plan-now">
            {trackLabel === 'Page'
              ? (stepIndex === 0 ? 'Objectives' : current?.title === 'Quiz' ? 'Quiz' : `Page ${stepIndex} of ${roadmap.filter((r) => r.title !== 'Quiz').length - 1}`)
              : `${trackLabel} ${stepIndex + 1} of ${roadmap.length}`}
            {current?.title && current.title !== 'Quiz' && stepIndex !== 0 ? ` — ${current.title}` : ''}
          </p>
        </div>
      )}
      {connecting ? (
        // A genuine wait — the session is not open yet.
        <div className="live-board-empty">
          <h2>{topic || 'Your lesson'}</h2>
          <p>Setting up your class…</p>
          <div className="live-writing-dots" aria-hidden="true"><i /><i /><i /></div>
        </div>
      ) : board.length === 0 ? (
        // Connected and teaching, nothing written yet. This must look like a
        // REAL empty whiteboard — a teacher writes the topic at the top and
        // starts talking. Showing a centred title with loading dots made the
        // page look stuck while she was already speaking.
        <article className="live-board-sheet">
          <div className="lb-entry">
            <header className="lb-focus">
              <h2>{topic || 'Your lesson'}</h2>
              {preparing && <p className="lb-objective">thinking…</p>}
            </header>
          </div>
        </article>
      ) : (
        <article className="live-board-sheet">
          {!board.some((op) => op.action === 'set_focus') && (
            <div className="lb-entry">
              <header className="lb-focus"><h2>{(trackLabel === 'Page' && current?.title) || topic || 'Your lesson'}</h2></header>
            </div>
          )}
          {board.map((op, index) => (
            <div
              className="lb-entry"
              key={op.id || `${op.action}-${index}`}
              data-latest={index === board.length - 1 ? 'true' : undefined}
              data-op-id={op.id}
              data-focus={op.id === focusId ? 'true' : undefined}
              style={op.delay ? { animationDelay: `${op.delay}s` } : undefined}
            >
              <Line operation={op} onQuizAnswer={onQuizAnswer} />
            </div>
          ))}
          <div ref={endRef} aria-hidden="true" />
        </article>
      )}
    </div>
  )
}
