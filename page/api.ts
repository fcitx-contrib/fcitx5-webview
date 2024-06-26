import {
  panel,
  hoverables,
  preedit,
  auxUp,
  auxDown
} from './selector'
import {
  div,
  setActions,
  hideContextmenu,
  getHoverBehavior,
  getPagingButtonsStyle,
  resize
} from './ux'
import {
  setTheme,
  setAccentColor
} from './theme'
import { setStyle } from './customize'
import { fcitxLog } from './log'
import {
  getScrollState,
  setScrollState,
  setScrollEnd,
  recalculateScroll,
  scrollKeyAction,
  fetchComplete
} from './scroll'

window.fcitxLog = fcitxLog
window._onload && window._onload()

function escapeWS (s: string) {
  // XXX: &emsp; is broken in Safari
  return s.replaceAll(' ', '&nbsp;').replaceAll('\n', '<br>').replaceAll('\t', '&emsp;')
}

function divider (paging: boolean = false) {
  const e = div('divider')
  // Is this divider between candidates and paging buttons?
  if (paging) {
    e.classList.add('divider-paging')
  }
  const dividerStart = div('divider-side')
  const dividerMiddle = div('divider-middle')
  const dividerEnd = div('divider-side')
  e.append(dividerStart, dividerMiddle, dividerEnd)
  return e
}

function setLayout (layout : 0 | 1) {
  switch (layout) {
    case 0:
      hoverables.classList.remove('vertical')
      hoverables.classList.add('horizontal')
      break
    case 1:
      hoverables.classList.remove('horizontal')
      hoverables.classList.add('vertical')
  }
}

function setWritingMode (mode: 0 | 1 | 2) {
  const classes = ['horizontal-tb', 'vertical-rl', 'vertical-lr']
  for (let i = 0; i < classes.length; ++i) {
    if (mode === i) {
      panel.classList.add(classes[i])
    } else {
      panel.classList.remove(classes[i])
    }
  }
}

function moveHighlight (from: Element | null, to: Element | null) {
  from?.classList.remove('highlighted')
  to?.classList.add('highlighted')
  const fromMark = from?.querySelector('.mark')
  const toMark = to?.querySelector('.mark')
  if (fromMark && !toMark) {
    to?.querySelector('.candidate-inner')?.prepend(fromMark)
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

function setCandidates (cands: Candidate[], highlighted: number, markText: string, pageable: boolean, hasPrev: boolean, hasNext: boolean, scrollState: SCROLL_STATE, scrollStart: boolean, scrollEnd: boolean) {
  setScrollState(scrollState)
  // Clear existing candidates when scroll continues.
  if (scrollState !== 2 || scrollStart) {
    hoverables.innerHTML = ''
    hoverables.scrollTop = 0 // Otherwise last scroll position will be kept.
  } else {
    fetchComplete()
  }
  if (scrollState === 2) {
    hoverables.classList.add('horizontal-scroll')
    setScrollEnd(scrollEnd)
  } else {
    hoverables.classList.remove('horizontal-scroll')
  }
  for (let i = 0; i < cands.length; ++i) {
    const candidate = div('candidate', 'hoverable')
    if (i === 0) {
      candidate.classList.add('candidate-first')
    } else {
      hoverables.append(divider())
    }
    if (i === highlighted) {
      candidate.classList.add('highlighted', 'highlighted-original')
    }
    if (i === cands.length - 1) {
      candidate.classList.add('candidate-last')
    }

    const candidateInner = div('candidate-inner', 'hoverable-inner')

    // Render placeholder for vertical non-highlighted candidates
    if (hoverables.classList.contains('vertical') || i === highlighted) {
      const mark = div('mark')
      if (markText === '') {
        mark.classList.add('no-text')
      } else {
        mark.innerHTML = markText
      }
      candidateInner.append(mark)
    }

    if (cands[i].label || scrollState === 2) {
      const label = div('label')
      label.innerHTML = escapeWS(cands[i].label || '0')
      candidateInner.append(label)
    }

    const text = div('text')
    text.innerHTML = escapeWS(cands[i].text)
    candidateInner.append(text)

    if (cands[i].comment) {
      const comment = div('comment')
      comment.innerHTML = escapeWS(cands[i].comment)
      candidateInner.append(comment)
    }

    candidate.append(candidateInner)
    hoverables.append(candidate)
  }

  setActions(cands.map(c => c.actions))

  if (scrollState === 1) {
    hoverables.append(divider(true))
    const expand = div('expand', 'hoverable-inner')
    expand.innerHTML = arrowForward
    const paging = div('paging', 'scroll', 'hoverable')
    paging.append(expand)
    hoverables.append(paging)
  } else if (scrollState === 0 && pageable) {
    const isArrow = getPagingButtonsStyle() === 'Arrow'
    hoverables.append(divider(true))

    const prev = div('prev', 'hoverable')
    const prevInner = div('paging-inner')
    if (hasPrev) {
      prevInner.classList.add('hoverable-inner')
    }
    prevInner.innerHTML = isArrow ? arrowBack : caretLeft
    prev.appendChild(prevInner)

    const next = div('next', 'hoverable')
    const nextInner = div('paging-inner')
    if (hasNext) {
      nextInner.classList.add('hoverable-inner')
    }
    nextInner.innerHTML = isArrow ? arrowForward : caretRight
    next.appendChild(nextInner)

    const paging = div('paging')
    if (isArrow) {
      paging.classList.add('arrow')
    } else {
      paging.classList.add('triangle')
    }
    paging.appendChild(prev)
    paging.appendChild(next)
    hoverables.appendChild(paging)
  } else if (scrollState === 2) {
    window.requestAnimationFrame(() => {
      recalculateScroll(scrollStart)
    })
  }

  for (const hoverable of hoverables.querySelectorAll('.hoverable')) {
    hoverable.addEventListener('mouseenter', () => {
      const hoverBehavior = getHoverBehavior()
      if (hoverBehavior === 'Move') {
        const lastHighlighted = hoverables.querySelector('.highlighted')
        moveHighlight(lastHighlighted, hoverable)
      }
    })
  }
}

function updateElement (element: Element, innerHTML: string) {
  if (innerHTML === '') {
    element.classList.add('hidden')
  } else {
    element.innerHTML = innerHTML
    element.classList.remove('hidden')
  }
}

function updateInputPanel (preeditHTML: string, auxUpHTML: string, auxDownHTML: string) {
  hideContextmenu()
  updateElement(preedit, preeditHTML)
  updateElement(auxUp, auxUpHTML)
  updateElement(auxDown, auxDownHTML)
}

function copyHTML () {
  const html = document.documentElement.outerHTML
  window._copyHTML(html)
}

hoverables.addEventListener('mouseleave', () => {
  const hoverBehavior = getHoverBehavior()
  if (hoverBehavior === 'Move') {
    const lastHighlighted = hoverables.querySelector('.highlighted')
    const originalHighlighted = hoverables.querySelector('.highlighted-original')
    moveHighlight(lastHighlighted, originalHighlighted)
  }
})

hoverables.addEventListener('wheel', e => {
  if (getScrollState() === 2) {
    return
  }
  window._page((<WheelEvent>e).deltaY > 0)
})

setTheme(0)

// JavaScript APIs that webview_candidate_window.mm calls
window.setCandidates = setCandidates
window.setLayout = setLayout
window.updateInputPanel = updateInputPanel
window.resize = resize
window.setTheme = setTheme
window.setAccentColor = setAccentColor
window.setStyle = setStyle
window.setWritingMode = setWritingMode
window.copyHTML = copyHTML
window.scrollKeyAction = scrollKeyAction
