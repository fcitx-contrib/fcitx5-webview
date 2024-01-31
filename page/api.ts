const panel = document.querySelector('.panel')!
const candidates = panel.querySelector('.candidates')!
const preedit = document.querySelector('.preedit')!
const auxUp = document.querySelector('.aux-up')!
const auxDown = document.querySelector('.aux-down')!

let cursorX = 0
let cursorY = 0
let pressed = false
let dragging = false
let startX = 0
let startY = 0

document.addEventListener('mousedown', e => {
  pressed = true
  startX = e.clientX
  startY = e.clientY
})

document.addEventListener('mousemove', e => {
  if (!pressed) {
    return
  }
  dragging = true
  // minus because macOS has bottom-left (0, 0)
  resize(cursorX + (e.clientX - startX), cursorY - (e.clientY - startY))
})

document.addEventListener('mouseup', e => {
  pressed = false
  if (dragging) {
    dragging = false
    return
  }
  let target = e.target as Element
  if (target === candidates || !candidates.contains(target)) {
    return
  }
  while (target.parentElement !== candidates) {
    target = target.parentElement!
  }
  for (let i = 0; i < candidates.childElementCount; ++i) {
    if (candidates.children[i] === target) {
      return window._select(i)
    }
  }
})

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

function resize (x: number, y: number) {
  cursorX = x
  cursorY = y
  const rect = panel.getBoundingClientRect()
  window._resize(x, y, rect.width, rect.height)
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

// JavaScript APIs that webview_candidate_window.mm calls
window.setCandidates = setCandidates
window.setLayout = setLayout
window.updateInputPanel = updateInputPanel
window.resize = resize
