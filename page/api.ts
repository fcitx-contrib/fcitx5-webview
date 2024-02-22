import {
  candidates,
  preedit,
  auxUp,
  auxDown
} from './selector'
import { resize } from './ux'
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

function setCandidates (cands: string[], labels: string[], highlighted: number) {
  candidates.innerHTML = ''
  for (let i = 0; i < cands.length; ++i) {
    const candidate = document.createElement('div')
    candidate.classList.add('candidate')
    if (i === highlighted) {
      candidate.classList.add('highlighted')
    }
    const label = document.createElement('div')
    label.classList.add('label')
    label.innerHTML = labels[i]
    const text = document.createElement('div')
    text.classList.add('text')
    text.innerHTML = cands[i]
    candidate.appendChild(label)
    candidate.appendChild(text)
    candidates.appendChild(candidate)
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

setTheme(0)

// JavaScript APIs that webview_candidate_window.mm calls
window.setCandidates = setCandidates
window.setLayout = setLayout
window.updateInputPanel = updateInputPanel
window.resize = resize
window.setTheme = setTheme
window.setAccentColor = setAccentColor
window.setStyle = setStyle
