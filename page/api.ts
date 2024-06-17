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
  resize
} from './ux'
import {
  setTheme,
  setAccentColor
} from './theme'
import { setStyle } from './customize'
import { fcitxLog } from './log'

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

// Used by setCandidates to rotate paging buttons
let currentWritingMode = 0

function setWritingMode (mode: 0 | 1 | 2) {
  currentWritingMode = mode
  switch (mode) {
    case 0:
      panel.classList.remove('vertical-rl', 'vertical-lr')
      break
    case 1:
      panel.classList.remove('vertical-lr')
      panel.classList.add('vertical-rl')
      break
    case 2:
      panel.classList.remove('vertical-rl')
      panel.classList.add('vertical-lr')
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

// font-awesome
// Use 2 icons instead of flipping one to avoid 1-pixel shift bug.
const common = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 192 512"><path d="{}" fill="currentColor"></path></svg>'
const caretLeft = common.replace('{}', 'M192 127.338v257.324c0 17.818-21.543 26.741-34.142 14.142L29.196 270.142c-7.81-7.81-7.81-20.474 0-28.284l128.662-128.662c12.599-12.6 34.142-3.676 34.142 14.142z')
const caretRight = common.replace('{}', 'M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z')

function caretPrevPage () {
  if (currentWritingMode > 0) {
    return '<div style="transform: rotate(90deg);">' + caretLeft + '</div>'
  } else {
    return caretLeft
  }
}

function caretNextPage () {
  if (currentWritingMode > 0) {
    return '<div style="transform: rotate(90deg);">' + caretRight + '</div>'
  } else {
    return caretRight
  }
}

function setCandidates (cands: Candidate[], highlighted: number, markText: string, pageable: boolean, hasPrev: boolean, hasNext: boolean) {
  hoverables.innerHTML = ''
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

    if (cands[i].label) {
      const label = div('label')
      label.innerHTML = escapeWS(cands[i].label)
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

  if (pageable) {
    hoverables.append(divider(true))

    const prev = div('prev', 'hoverable')
    const prevInner = div('paging-inner')
    if (hasPrev) {
      prevInner.classList.add('hoverable-inner')
    }
    prevInner.innerHTML = caretPrevPage()
    prev.appendChild(prevInner)

    const next = div('next', 'hoverable')
    const nextInner = div('paging-inner')
    if (hasNext) {
      nextInner.classList.add('hoverable-inner')
    }
    nextInner.innerHTML = caretNextPage()
    next.appendChild(nextInner)

    const paging = div('paging')
    paging.appendChild(prev)
    paging.appendChild(next)
    hoverables.appendChild(paging)
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
