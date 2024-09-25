import {
  expand,
  getScrollState,
} from './scroll'
import {
  contextmenu,
  decoration,
  hoverables,
  panel,
  theme,
} from './selector'

const DRAG_THRESHOLD = 10

let pressed = false
let dragging = false
let startX = 0
let startY = 0
// accumulate
let dX = 0
let dY = 0
let dragOffset = 0

// 0: reset, 1: initial (when window is shown even if no mouse move there will be a mousemove event), 2+: moved
let mouseMoveState = 0
export function resetMouseMoveState() {
  mouseMoveState = 0
  hoverables.classList.remove('fcitx-mousemoved')
}

interface ShadowBox {
  anchorTop: number
  anchorRight: number
  anchorLeft: number
  right: number
  bottom: number
}

export function resize(
  call_id: number,
  dx: number,
  dy: number,
  dragging: boolean,
  hasContextmenu: boolean,
) {
  function adaptWindowSize(reserveSpaceForContextmenu: boolean) {
    let {
      anchorTop,
      anchorRight,
      anchorLeft,
      right,
      bottom,
    } = getBoundingRectWithShadow(panel)

    // Account for window decorations.
    const dRect = decoration.getBoundingClientRect()
    anchorTop = Math.min(anchorTop, dRect.top)
    anchorLeft = Math.min(anchorLeft, dRect.left)
    if (dRect.right > right) {
      anchorRight = right = dRect.right
    }
    // Always use decoration's bottom as anchorBottom because
    // 1. When no decoration, it's the same with panel's.
    // 2. When there is decoration and no enough room under client preedit,
    //    we don't want layout shift of decoration when scroll is expanded.
    const anchorBottom = dRect.bottom
    if (anchorBottom > bottom) {
      bottom = dRect.bottom
    }

    // HACK: enlarge then shrink.
    if (reserveSpaceForContextmenu) {
      right += 100
      bottom += 100
    }
    else if (contextmenu.style.display === 'block') {
      const {
        right: r,
        bottom: b,
      } = getBoundingRectWithShadow(contextmenu)
      right = Math.max(right, r)
      bottom = Math.max(bottom, b)
    }

    const pRect = panel.getBoundingClientRect()
    const pRadius = Number.parseFloat(getComputedStyle(panel).borderRadius)
    window.fcitx._resize(call_id, dx, dy, anchorTop, anchorRight, anchorBottom, anchorLeft, pRect.top, pRect.right, pRect.bottom, pRect.left, pRadius, right, bottom, dragging)
  }
  adaptWindowSize(hasContextmenu)
  if (!dragging) {
    // Sometimes getBoundingClientRect is called when the element is not fully rendered.
    window.requestAnimationFrame(() => {
      adaptWindowSize(hasContextmenu)
      if (hasContextmenu) {
        adaptWindowSize(false)
      }
    })
  }
}

function getBoundingRectWithShadow(element: Element): ShadowBox {
  const rect = element.getBoundingClientRect()
  let xHi = rect.right
  let yHi = rect.bottom

  const vals = window.getComputedStyle(element).boxShadow.split(' ').map(Number.parseFloat)
  // The format of computed style is 'rgb(255, 0, 0) 10px 5px 5px 0px, rgb(255, 0, 0) 10px 5px 5px 0px'
  // Therefore, vals has exactly (7*n) elements, and vals[7*i] will be NaN.
  for (let i = 0; i < vals.length / 7; i += 1) {
    const offsetX = vals[7 * i + 3]
    const offsetY = vals[7 * i + 4]
    const blurRadius = vals[7 * i + 5]
    const spreadRadius = vals[7 * i + 6]
    const deltaX = offsetX + blurRadius + spreadRadius
    const deltaY = offsetY + blurRadius + spreadRadius
    const shadowXHi = rect.right + (deltaX > 0 ? deltaX : 0)
    const shadowYHi = rect.bottom + (deltaY > 0 ? deltaY : 0)
    if (shadowXHi > xHi)
      xHi = shadowXHi
    if (shadowYHi > yHi)
      yHi = shadowYHi
  }
  // Extend the rect to contain the shadow.
  return {
    anchorTop: rect.top,
    anchorRight: rect.right,
    anchorLeft: rect.left,
    right: xHi,
    bottom: yHi,
  }
}

export function div(...classList: string[]) {
  const element = document.createElement('div')
  element.classList.add(...classList)
  return element
}

function isInsideHoverables(target: Element) {
  return target !== hoverables && hoverables.contains(target)
}

function getCandidateIndex(target: Element) {
  const allCandidates = hoverables.querySelectorAll('.fcitx-candidate')
  for (let i = 0; i < allCandidates.length; ++i) {
    if (allCandidates[i] === target) {
      return i
    }
  }
  return -1
}

export function showContextmenu(x: number, y: number, index: number, actions: CandidateAction[]) {
  contextmenu.innerHTML = ''
  for (const action of actions) {
    const item = div('fcitx-menu-item')
    item.innerHTML = action.text
    item.addEventListener('click', () => {
      window.fcitx._action(index, action.id)
      hideContextmenu()
    })
    contextmenu.appendChild(item)
  }
  contextmenu.style.top = `${y}px`
  contextmenu.style.left = `${x}px`
  contextmenu.style.display = 'block'
  resize(0, 0, false, true)
}

export function hideContextmenu() {
  contextmenu.innerHTML = ''
  contextmenu.style.display = 'none'
}

const receiver = (window.fcitx.distribution === 'fcitx5-js' ? decoration : document) as HTMLElement

receiver.addEventListener('mousedown', (e) => {
  if (e.button !== 0) {
    return
  }
  pressed = true
  startX = e.clientX
  startY = e.clientY
  dX = 0
  dY = 0
  dragOffset = 0
})

receiver.addEventListener('mousemove', (e) => {
  if (++mouseMoveState >= 2) {
    hoverables.classList.add('fcitx-mousemoved')
  }
  if (e.button !== 0 || !pressed) {
    return
  }
  hideContextmenu()
  dragging = true
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (window.fcitx.distribution === 'fcitx5-js') {
    // On desktop mouse is always at where drag starts in the html,
    // but on f5j mouse can be anywhere during drag.
    startX = e.clientX
    startY = e.clientY
  }
  dX += dx
  dY += dy
  dragOffset = Math.max(dragOffset, dX * dX + dY * dY)
  resize(dx, dy, true, false)
})

receiver.addEventListener('mouseup', (e) => {
  if (e.button !== 0) {
    return
  }
  pressed = false
  if (dragging) {
    dragging = false
    if (dragOffset > DRAG_THRESHOLD) {
      return
    }
  }
  let target = e.target as Element
  if (!isInsideHoverables(target)) {
    return
  }
  while (target.parentElement !== hoverables) {
    if (target.classList.contains('fcitx-prev')) {
      return window.fcitx._page(false)
    }
    else if (target.classList.contains('fcitx-next')) {
      return window.fcitx._page(true)
    }
    else if (target.classList.contains('fcitx-expand')) {
      return expand()
    }
    target = target.parentElement!
  }
  const i = getCandidateIndex(target)
  if (i >= 0) {
    return window.fcitx._select(i)
  }
})

let actions: CandidateAction[][] = []
export function setActions(newActions: CandidateAction[][]) {
  actions = newActions
}

let actionX = 0
let actionY = 0
let actionIndex = 0

export function answerActions(actions: CandidateAction[]) {
  showContextmenu(actionX, actionY, actionIndex, actions)
}

receiver.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  let target = e.target as Element
  if (!isInsideHoverables(target)) {
    return
  }

  const x = e.clientX - (window.fcitx.distribution === 'fcitx5-js' ? theme.getBoundingClientRect().left : 0)
  const y = e.clientY - (window.fcitx.distribution === 'fcitx5-js' ? theme.getBoundingClientRect().top : 0)

  while (target.parentElement !== hoverables) {
    target = target.parentElement!
  }
  const i = getCandidateIndex(target)
  if (i >= 0 && getScrollState() === 2) {
    actionX = x
    actionY = y
    actionIndex = i
    return window.fcitx._askActions(i)
  }
  if (i >= 0 && actions[i].length > 0) {
    showContextmenu(x, y, i, actions[i])
  }
  else {
    hideContextmenu()
  }
})

const panelBlurOuter = document.querySelector('.fcitx-panel-blur-outer')!
const panelBlurInner = document.querySelector('.fcitx-panel-blur-inner')!

let blurEnabled = false
export function setBlur(enabled: boolean) {
  blurEnabled = enabled
  if (window.fcitx.distribution === 'fcitx5-js') {
    if (enabled) {
      panelBlurInner.classList.add('fcitx-blur')
    }
    else {
      panelBlurInner.classList.remove('fcitx-blur')
    }
  }
}

// HACK: force redraw blur every 40ms so that window background change counts
let blurSwitch = false
function redrawBlur() {
  if (!blurEnabled || !theme.classList.contains('fcitx-macos')) {
    return
  }
  if (blurSwitch) {
    panelBlurOuter.classList.add('fcitx-blur')
    panelBlurInner.classList.remove('fcitx-blur')
  }
  else {
    panelBlurInner.classList.add('fcitx-blur')
    panelBlurOuter.classList.remove('fcitx-blur')
  }
  blurSwitch = !blurSwitch
}

if (window.fcitx.distribution !== 'fcitx5-js') { // macOS <= 14
  setInterval(redrawBlur, 40)
}

export function showCursor(show: boolean) {
  const cursor = document.querySelector('.fcitx-cursor')
  if (cursor) {
    (<HTMLElement>cursor).style.opacity = show ? '1' : '0'
  }
}

let blinkEnabled = true
export function setBlink(enabled: boolean) {
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
export function setHoverBehavior(behavior: HOVER_BEHAVIOR) {
  hoverBehavior = behavior
}
export function getHoverBehavior() {
  return hoverBehavior
}

export type PAGING_BUTTONS_STYLE = 'None' | 'Arrow' | 'Triangle'
let pagingButtonsStyle: PAGING_BUTTONS_STYLE = 'Arrow'
export function setPagingButtonsStyle(style: PAGING_BUTTONS_STYLE) {
  pagingButtonsStyle = style
}
export function getPagingButtonsStyle() {
  return pagingButtonsStyle
}
