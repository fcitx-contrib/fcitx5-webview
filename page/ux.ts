import {
  panel,
  candidates
} from './selector'

let cursorX = 0
let cursorY = 0
let pressed = false
let dragging = false
let startX = 0
let startY = 0

export function resize (x: number, y: number) {
  cursorX = x
  cursorY = y
  const rect = panel.getBoundingClientRect()
  window._resize(x, y, rect.width, rect.height)
}

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
