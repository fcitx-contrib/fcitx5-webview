import {
  panel,
  candidates
} from './selector'

let pressed = false
let dragging = false
let startX = 0
let startY = 0

export function resize (dx: number, dy: number, dragging: boolean) {
  const rect = getBoundingRectWithShadow(panel)
  window._resize(dx, dy, rect.x, rect.y, rect.width, rect.height, dragging)
}

function getBoundingRectWithShadow (element: Element) {
  const rect = element.getBoundingClientRect()
  const elementXHi = rect.x + rect.width
  const elementYHi = rect.y + rect.height
  let xHi = elementXHi
  let yHi = elementYHi
  const vals = window.getComputedStyle(element).boxShadow.split(' ').map(parseFloat)
  // The format of computed style is 'rgb(255, 0, 0) 10px 5px 5px 0px, rgb(255, 0, 0) 10px 5px 5px 0px'
  // Therefore, vals has exactly (7*n) elements, and vals[7*i] will be NaN.
  for (let i = 0; i < vals.length / 7; i += 1) {
    const offsetX = vals[7 * i + 3]
    const offsetY = vals[7 * i + 4]
    const blurRadius = vals[7 * i + 5]
    const spreadRadius = vals[7 * i + 6]
    const deltaX = offsetX + blurRadius + spreadRadius
    const deltaY = offsetY + blurRadius + spreadRadius
    const shadowXHi = elementXHi + (deltaX > 0 ? deltaX : 0)
    const shadowYHi = elementYHi + (deltaY > 0 ? deltaY : 0)
    if (shadowXHi > xHi) xHi = shadowXHi
    if (shadowYHi > yHi) yHi = shadowYHi
  }
  // Extend the rect to contain the shadow.
  // rect.x and rect.y will be the coordinates of the top-left of the panel.
  // rect.height and rect.width will cover the whole panel and its shadow.
  rect.width = xHi
  rect.height = yHi
  return rect
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
