import {
  panel,
  candidates
} from './selector'

let pressed = false
let dragging = false
let startX = 0
let startY = 0

export function resize (dx: number, dy: number, dragging: boolean) {
  const rect = panel.getBoundingClientRect()
  window._resize(dx, dy, rect.width, rect.height, dragging)
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
  resize(e.clientX - startX, -(e.clientY - startY), true)
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

// HACK: force redraw blur every 40ms so that window background change counts
let blurSwitch = false
const panelBlur = document.querySelector('.panel-blur')!
function redrawBlur () {
  if (!panel.classList.contains('macos')) {
    return
  }
  if (blurSwitch) {
    panelBlur.classList.add('blur')
    panel.classList.remove('blur')
  } else {
    panel.classList.add('blur')
    panelBlur.classList.remove('blur')
  }
  blurSwitch = !blurSwitch
}
setInterval(redrawBlur, 40)
