import emojiRegex from 'emoji-regex'
import { SCROLL_NONE, SCROLL_READY, SCROLLING } from './constant'
import { getLabelFormatter, setLastLabels } from './format-label'
import { fixGhostStripe } from './ghost-stripe'
import { fetchComplete, recalculateScroll, setScrollEnd, setScrollState } from './scroll'
import { auxDown, auxUp, hoverables, preedit, theme } from './selector'
import { div, getHoverBehavior, getPagingButtonsStyle, hideContextmenu, resetMouseMoveState, setActions, setColorTransition } from './ux'

const regex = emojiRegex()
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function isSingleEmoji(text: string) {
  regex.lastIndex = 0
  return Array.from(segmenter.segment(text)).length === 1 && regex.test(text)
}

function divider(paging: boolean = false) {
  const e = div('fcitx-divider')
  // Is this divider between candidates and paging buttons?
  if (paging) {
    e.classList.add('fcitx-divider-paging')
  }
  const dividerStart = div('fcitx-divider-side')
  const dividerMiddle = div('fcitx-divider-middle')
  const dividerEnd = div('fcitx-divider-side')
  e.append(dividerStart, dividerMiddle, dividerEnd)
  return e
}

let markText = ''
export function setHighlightMarkText(text: string) {
  markText = text
}

let caretText = ''
export function setCaretText(text: string) {
  caretText = text
}

export function moveHighlight(from: Element | null, to: Element | null) {
  from?.classList.remove('fcitx-highlighted')
  to?.classList.add('fcitx-highlighted')
  // In vertical or scroll mode, there are multiple marks,
  // but either toMark exists (for candidate) or candidateInner doesn't exist (for paging button).
  // In horizontal mode, there is a unique mark.
  // Don't get mark from "from" because when mouse moves from paging button to outside,
  // we need to move highlight from the last hovered candidate (not paging button) to original.
  const mark = hoverables?.querySelector('.fcitx-mark')
  const toMark = to?.querySelector('.fcitx-mark')
  const candidateInner = to?.querySelector('.fcitx-candidate-inner') // not paging button
  if (mark && !toMark && candidateInner) {
    candidateInner.prepend(mark)
  }
}

// Use 2 icons instead of flipping one to avoid 1-pixel shift bug.
const common = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{}"><path d="{}" fill="currentColor"></path></svg>'
// font-awesome
const caretLeft = common.replace('{}', '0 0 192 512').replace('{}', 'M192 127.338v257.324c0 17.818-21.543 26.741-34.142 14.142L29.196 270.142c-7.81-7.81-7.81-20.474 0-28.284l128.662-128.662c12.599-12.6 34.142-3.676 34.142 14.142z')
const caretRight = common.replace('{}', '0 0 192 512').replace('{}', 'M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z')
// material
const arrowBack = common.replace('{}', '0 0 24 24').replace('{}', 'M16.62 2.99a1.25 1.25 0 0 0-1.77 0L6.54 11.3a.996.996 0 0 0 0 1.41l8.31 8.31c.49.49 1.28.49 1.77 0s.49-1.28 0-1.77L9.38 12l7.25-7.25c.48-.48.48-1.28-.01-1.76z')
const arrowForward = common.replace('{}', '0 0 24 24').replace('{}', 'M7.38 21.01c.49.49 1.28.49 1.77 0l8.31-8.31a.996.996 0 0 0 0-1.41L9.15 2.98c-.49-.49-1.28-.49-1.77 0s-.49 1.28 0 1.77L14.62 12l-7.25 7.25c-.48.48-.48 1.28.01 1.76z')

export function setCandidates(cands: Candidate[], highlighted: number, pageable: boolean, hasPrev: boolean, hasNext: boolean, scrollState: SCROLL_STATE, scrollStart: boolean, scrollEnd: boolean) {
  if (cands.length) {
    // Auto layout requires display: not none so that getBoundingClientRect works.
    theme.classList.remove('fcitx-hidden')
  }
  const isVertical = hoverables.classList.contains('fcitx-vertical')
  resetMouseMoveState()
  hideContextmenu()
  setScrollState(scrollState)
  // Clear existing candidates when scroll continues.
  if (scrollState !== SCROLLING || scrollStart) {
    hoverables.innerHTML = ''
    hoverables.scrollTop = 0 // Otherwise last scroll position will be kept.
  }
  else {
    fetchComplete()
  }
  if (scrollState === SCROLLING) {
    hoverables.classList.add('fcitx-horizontal-scroll')
    hoverables.style.maxBlockSize = '' // Fallback to non-inline larger max-block-size.
    setScrollEnd(scrollEnd)
    // Disable transition to avoid flash on scroll expand and highlight move under light theme.
    setColorTransition(false)
  }
  else {
    hoverables.classList.remove('fcitx-horizontal-scroll')
    if (scrollState === SCROLL_READY) {
      setLastLabels(cands.map(c => c.label))
    }
    else {
      // Cleanup all leftovers.
      hoverables.style.maxBlockSize = ''
    }
    setColorTransition(true)
  }
  const label0 = getLabelFormatter()(0)
  for (let i = 0; i < cands.length; ++i) {
    const candidate = div('fcitx-candidate', 'fcitx-hoverable')
    if (i === 0 && scrollState !== SCROLLING) {
      candidate.classList.add('fcitx-candidate-first')
    }
    if (i === highlighted) {
      candidate.classList.add('fcitx-highlighted', 'fcitx-highlighted-original')
    }
    if (i === cands.length - 1 && scrollState !== SCROLLING) {
      candidate.classList.add('fcitx-candidate-last')
    }

    const candidateInner = div('fcitx-candidate-inner', 'fcitx-hoverable-inner')

    // Render placeholder for vertical/scroll non-highlighted candidates
    if (isVertical || hoverables.classList.contains('fcitx-horizontal-scroll') || i === highlighted) {
      const mark = div('fcitx-mark')
      if (markText === '') {
        mark.classList.add('fcitx-no-text')
      }
      else {
        mark.textContent = markText
      }
      candidateInner.append(mark)
    }

    if (cands[i].label || scrollState === SCROLLING) {
      const label = div('fcitx-label')
      label.textContent = cands[i].label || label0
      candidateInner.append(label)
    }

    const text = div('fcitx-text')
    text.textContent = cands[i].text
    if (isSingleEmoji(cands[i].text)) {
      // Hack: for vertical-lr writing mode, 🙅‍♂️ is rotated on Safari and split to 🙅 and ♂ on Chrome.
      // Can't find a way that works for text that contains not only emoji (e.g. for preedit) but
      // it's a rare case for candidates so should be acceptable.
      text.style.writingMode = 'horizontal-tb'
    }
    candidateInner.append(text)

    if (cands[i].comment) {
      const comment = div('fcitx-comment')
      comment.textContent = cands[i].comment
      candidateInner.append(comment)
    }

    candidate.append(div('fcitx-candidate-background')) // The only purpose is to fix ghost stripe.
    candidate.append(candidateInner)
    hoverables.append(candidate)

    // For horizontal/scroll mode it needs to fill the row when candidates are not enough.
    // For vertical mode, this last divider is hidden.
    hoverables.append(divider())
  }

  setActions(cands.map(c => c.actions))

  if (scrollState === SCROLL_READY && getPagingButtonsStyle() !== 'None') {
    hoverables.append(divider(true))
    const expand = div('fcitx-expand', 'fcitx-paging-inner', 'fcitx-hoverable-inner')
    expand.innerHTML = arrowForward
    const paging = div('fcitx-paging', 'fcitx-scroll', 'fcitx-hoverable')
    paging.append(expand)
    hoverables.append(paging)
  }
  else if (scrollState === SCROLL_NONE && pageable) {
    const isArrow = getPagingButtonsStyle() === 'Arrow'
    hoverables.append(divider(true))

    const prev = div('fcitx-prev', 'fcitx-hoverable')
    const prevInner = div('fcitx-paging-inner')
    if (hasPrev) {
      prevInner.classList.add('fcitx-hoverable-inner')
    }
    prevInner.innerHTML = isArrow ? arrowBack : caretLeft
    prev.appendChild(prevInner)

    const next = div('fcitx-next', 'fcitx-hoverable')
    const nextInner = div('fcitx-paging-inner')
    if (hasNext) {
      nextInner.classList.add('fcitx-hoverable-inner')
    }
    nextInner.innerHTML = isArrow ? arrowForward : caretRight
    next.appendChild(nextInner)

    const paging = div('fcitx-paging')
    if (isArrow) {
      paging.classList.add('fcitx-arrow')
    }
    else {
      paging.classList.add('fcitx-triangle')
    }
    paging.appendChild(prev)
    paging.appendChild(next)
    hoverables.appendChild(paging)
  }
  else if (scrollState === SCROLLING) {
    recalculateScroll(scrollStart)
  }

  for (const hoverable of hoverables.querySelectorAll('.fcitx-hoverable')) {
    hoverable.addEventListener('mousemove', () => {
      const hoverBehavior = getHoverBehavior()
      if (hoverBehavior === 'Move' && hoverables.classList.contains('fcitx-mousemoved')) {
        const lastHighlighted = hoverables.querySelector('.fcitx-highlighted')
        moveHighlight(lastHighlighted, hoverable)
      }
    })
  }

  // Unify label width for vertical and scroll mode, as some fonts have different widths for numbers.
  if ((isVertical && new Set(cands.map(cand => cand.label.length)).size === 1) || scrollStart) {
    let maxWidth = 0
    hoverables.querySelectorAll('.fcitx-label').forEach((label) => {
      maxWidth = Math.max(maxWidth, label.getBoundingClientRect().width)
    })
    theme.style.setProperty('--label-width', `${maxWidth}px`)
  }
  else if (scrollState !== SCROLLING) {
    theme.style.removeProperty('--label-width')
  }

  fixGhostStripe()
}

function updateElement(element: Element, formatted: [string, number][]) {
  element.innerHTML = ''
  if (formatted.length === 0) {
    element.classList.add('fcitx-hidden')
  }
  else {
    for (const [text, _] of formatted) { // Ignore format for now.
      const child = document.createElement('span') // So that element doesn't need display: flex.
      child.textContent = text
      element.appendChild(child)
    }
    element.classList.remove('fcitx-hidden')
  }
}

export function updateInputPanel(formattedPreCaret: [string, number][], hasCaret: boolean, formattedPostCaret: [string, number][], formattedAuxUp: [string, number][], formattedAuxDown: [string, number][]) {
  const hasPreedit = formattedPreCaret.length || formattedPostCaret.length
  if (hasPreedit || formattedAuxUp.length || formattedAuxDown.length) {
    theme.classList.remove('fcitx-hidden')
  }
  hideContextmenu()

  const preCaret = preedit.querySelector('.fcitx-pre-caret') as HTMLElement
  const caret = preedit.querySelector('.fcitx-caret') as HTMLElement
  const postCaret = preedit.querySelector('.fcitx-post-caret') as HTMLElement

  updateElement(preCaret, formattedPreCaret)
  if (hasCaret) {
    caret.textContent = caretText
    if (caretText) {
      caret.classList.remove('fcitx-no-text')
    }
    else {
      caret.classList.add('fcitx-no-text')
    }
  }
  updateElement(postCaret, formattedPostCaret)
  if (hasPreedit) {
    preedit.classList.remove('fcitx-hidden')
  }
  else {
    preedit.classList.add('fcitx-hidden')
  }
  updateElement(auxUp, formattedAuxUp)
  updateElement(auxDown, formattedAuxDown)
}

export function hidePanel() {
  updateInputPanel([], false, [], [], [])
  setCandidates([], -1, false, false, false, SCROLL_NONE, false, false)
  theme.classList.add('fcitx-hidden')
}
