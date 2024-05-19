import {
  panel,
  contextmenu,
  hoverables
} from './selector'

let pressed = false
let dragging = false
let startX = 0
let startY = 0

type ShadowBox = {
  shadowTop: number,
  shadowRight: number,
  shadowBottom: number,
  shadowLeft: number,
  fullWidth: number,
  fullHeight: number
}

export function resize (dx: number, dy: number, dragging: boolean) {
  function adaptWindowSize () {
    const {
      shadowTop,
      shadowRight,
      shadowBottom,
      shadowLeft,
      fullWidth,
      fullHeight
    } = getBoundingRectWithShadow(panel)
    window._resize(dx, dy, shadowTop, shadowRight, shadowBottom, shadowLeft, fullWidth, fullHeight, dragging)
  }
  adaptWindowSize()
  if (!dragging) {
    // Sometimes getBoundingClientRect is called when the element is not fully rendered.
    window.requestAnimationFrame(adaptWindowSize)
  }
}

function getBoundingRectWithShadow (element: Element): ShadowBox {
  const rect = element.getBoundingClientRect()
  const elementXHi = rect.x + rect.width
  const elementYHi = rect.y + rect.height
  let xHi = elementXHi
  let yHi = elementYHi

  const contextmenuRect = contextmenu.getBoundingClientRect()
  const contextmenuXHi = contextmenuRect.x + contextmenuRect.width
  const contextmenuYHi = contextmenuRect.y + contextmenuRect.height
  if (contextmenuXHi > xHi) xHi = contextmenuXHi
  if (contextmenuYHi > yHi) yHi = contextmenuYHi

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
  return {
    shadowTop: rect.y,
    shadowRight: xHi - elementXHi,
    shadowBottom: yHi - elementYHi,
    shadowLeft: rect.x,
    fullWidth: xHi,
    fullHeight: yHi
  }
}

function isInsideHoverables (target: Element) {
  return target !== hoverables && hoverables.contains(target)
}

function getCandidateIndex (target: Element) {
  const allCandidates = hoverables.querySelectorAll('.candidate')
  for (let i = 0; i < allCandidates.length; ++i) {
    if (allCandidates[i] === target) {
      return i
    }
  }
  return -1
}

function hideContextmenu () {
  contextmenu.innerHTML = ''
}

document.addEventListener('mousedown', e => {
  if (e.button !== 0) {
    return
  }
  pressed = true
  startX = e.clientX
  startY = e.clientY
})

document.addEventListener('mousemove', e => {
  if (e.button !== 0 || !pressed) {
    return
  }
  dragging = true
  // minus because macOS has bottom-left (0, 0)
  resize(e.clientX - startX, -(e.clientY - startY), true)
})

document.addEventListener('mouseup', e => {
  if (e.button !== 0) {
    return
  }
  pressed = false
  if (dragging) {
    dragging = false
    return
  }
  let target = e.target as Element
  if (!isInsideHoverables(target)) {
    return
  }
  while (target.parentElement !== hoverables) {
    if (target.classList.contains('prev')) {
      return window._page(false)
    } else if (target.classList.contains('next')) {
      return window._page(true)
    }
    target = target.parentElement!
  }
  const i = getCandidateIndex(target)
  if (i >= 0) {
    return window._select(i)
  }
})

document.addEventListener('contextmenu', e => {
  e.preventDefault()
  let target = e.target as Element
  if (!isInsideHoverables(target)) {
    return
  }
  while (target.parentElement !== hoverables) {
    target = target.parentElement!
  }
  const i = getCandidateIndex(target)
  if (i >= 0) {
    contextmenu.innerHTML = '<div>删词</div>'
    contextmenu.style.top = `${e.clientY}px`
    contextmenu.style.left = `${e.clientX}px`
    resize(0, 0, false)
  } else {
    hideContextmenu()
  }
})

let blurEnabled = true
export function setBlur (enabled: boolean) {
  blurEnabled = enabled
}

// HACK: force redraw blur every 40ms so that window background change counts
let blurSwitch = false
const panelBlurOuter = document.querySelector('.panel-blur-outer')!
const panelBlurInner = document.querySelector('.panel-blur-inner')!
function redrawBlur () {
  if (!blurEnabled || !panel.classList.contains('macos')) {
    return
  }
  if (blurSwitch) {
    panelBlurOuter.classList.add('blur')
    panelBlurInner.classList.remove('blur')
  } else {
    panelBlurInner.classList.add('blur')
    panelBlurOuter.classList.remove('blur')
  }
  blurSwitch = !blurSwitch
}
setInterval(redrawBlur, 40)

export function showCursor (show: boolean) {
  const cursor = document.querySelector('.cursor')
  if (cursor) {
    (<HTMLElement>cursor).style.opacity = show ? '1' : '0'
  }
}

let blinkEnabled = true
export function setBlink (enabled: boolean) {
  blinkEnabled = enabled
  if (!enabled) {
    showCursor(true)
  }
}

let blinkSwitch = false
setInterval(() => {
  if (!blinkEnabled) {
    return
  }
  showCursor(blinkSwitch)
  blinkSwitch = !blinkSwitch
}, 500)

export type HOVER_BEHAVIOR = 'None' | 'Move' | 'Add'
let hoverBehavior: HOVER_BEHAVIOR = 'None'
export function setHoverBehavior (behavior: HOVER_BEHAVIOR) {
  hoverBehavior = behavior
}
export function getHoverBehavior () {
  return hoverBehavior
}
