import {
  candidates,
  preedit,
  auxUp,
  auxDown
} from './selector'
import {
  getHoverBehavior,
  resize
} from './ux'
import {
  setTheme,
  setAccentColor
} from './theme'
import { setStyle } from './customize'

function setLayout (layout : 0 | 1) {
  switch (layout) {
    case 0:
      candidates.classList.remove('vertical')
      candidates.classList.add('horizontal')
      break
    case 1:
      candidates.classList.remove('horizontal')
      candidates.classList.add('vertical')
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

function setCandidates (cands: string[], labels: string[], highlighted: number, markText: string) {
  candidates.innerHTML = ''
  for (let i = 0; i < cands.length; ++i) {
    const candidate = document.createElement('div')
    candidate.classList.add('candidate')
    if (i === highlighted) {
      candidate.classList.add('highlighted', 'highlighted-original')
    }

    candidate.addEventListener('mouseenter', () => {
      const hoverBehavior = getHoverBehavior()
      if (hoverBehavior === 'Move') {
        const lastHighlighted = candidates.querySelector('.highlighted')
        moveHighlight(lastHighlighted, candidate)
      }
    })

    const label = document.createElement('div')
    label.classList.add('label')
    label.innerHTML = labels[i]
    const text = document.createElement('div')
    text.classList.add('text')
    text.innerHTML = cands[i]
    const candidateInner = document.createElement('div')
    candidateInner.classList.add('candidate-inner')
    // Render placeholder for vertical non-highlighted candidates
    if (candidates.classList.contains('vertical') || i === highlighted) {
      const mark = document.createElement('div')
      mark.classList.add('mark')
      if (markText === '') {
        mark.classList.add('no-text')
      } else {
        mark.innerHTML = markText
      }
      candidateInner.append(mark)
    }
    candidateInner.append(label, text)
    candidate.append(candidateInner)
    candidates.append(candidate)
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
  updateElement(preedit, preeditHTML)
  updateElement(auxUp, auxUpHTML)
  updateElement(auxDown, auxDownHTML)
}

candidates.addEventListener('mouseleave', () => {
  const hoverBehavior = getHoverBehavior()
  if (hoverBehavior === 'Move') {
    const lastHighlighted = candidates.querySelector('.highlighted')
    const originalHighlighted = candidates.querySelector('.highlighted-original')
    moveHighlight(lastHighlighted, originalHighlighted)
  }
})

candidates.addEventListener('wheel', e => {
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
