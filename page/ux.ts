import {
  theme,
  panel,
  decoration,
  contextmenu,
  hoverables
} from './selector'
import {
  getScrollState,
  expand
} from './scroll'

const DRAG_THRESHOLD = 10

let pressed = false
let dragging = false
let startX = 0
let startY = 0
// accumulate
let dX = 0
let dY = 0
let dragOffset = 0

type ShadowBox = {
  shadowTop: number,
  shadowRight: number,
  shadowBottom: number,
  shadowLeft: number,
  fullWidth: number,
  fullHeight: number
}

export function resize (dx: number, dy: number, dragging: boolean, hasContextmenu: boolean) {
  function adaptWindowSize (reserveSpaceForContextmenu: boolean) {
    let {
      shadowTop,
      shadowRight,
      shadowBottom,
      shadowLeft,
      fullWidth,
      fullHeight
    } = getBoundingRectWithShadow(panel)

    // Account for window decorations.
    const dRect = decoration.getBoundingClientRect()
    if (dRect.width > fullWidth) {
      shadowLeft = 0
      shadowRight = 0
      fullWidth = dRect.width
    }
    if (dRect.height > fullHeight) {
      shadowTop = 0
      shadowBottom = 0
      fullHeight = dRect.height
    }

    // HACK: enlarge then shrink.
    let enlargedWidth = fullWidth
    let enlargedHeight = fullHeight
    if (reserveSpaceForContextmenu) {
      enlargedWidth += 100
      enlargedHeight += 100
    } else if (contextmenu.style.display === 'block') {
      const {
        fullWidth: xHi,
        fullHeight: yHi
      } = getBoundingRectWithShadow(contextmenu)
      enlargedWidth = Math.max(xHi, enlargedWidth)
      enlargedHeight = Math.max(yHi, enlargedHeight)
    }

    window._resize(dx, dy, shadowTop, shadowRight, shadowBottom, shadowLeft, fullWidth, fullHeight, enlargedWidth, enlargedHeight, dragging)
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

function getBoundingRectWithShadow (element: Element): ShadowBox {
  const parentRect = element.parentElement!.getBoundingClientRect()
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
  // fullWidth and fullHeight will cover the whole element and its shadow.
  return {
    shadowTop: rect.y - parentRect.y,
    shadowRight: xHi - elementXHi,
    shadowBottom: yHi - elementYHi,
    shadowLeft: rect.x - parentRect.x,
    fullWidth: xHi - parentRect.x,
    fullHeight: yHi - parentRect.y
  }
}

export function div (...classList: string[]) {
  const element = document.createElement('div')
  element.classList.add(...classList)
  return element
}

function isInsideHoverables (target: Element) {
  return target !== hoverables && hoverables.contains(target)
}

function getCandidateIndex (target: Element) {
  const allCandidates = hoverables.querySelectorAll('.fcitx-candidate')
  for (let i = 0; i < allCandidates.length; ++i) {
    if (allCandidates[i] === target) {
      return i
    }
  }
  return -1
}

export function showContextmenu (x: number, y: number, index: number, actions: CandidateAction[]) {
  contextmenu.innerHTML = ''
  for (const action of actions) {
    const item = div('fcitx-menu-item')
    item.innerHTML = action.text
    item.addEventListener('click', () => {
      window._action(index, action.id)
      hideContextmenu()
    })
    contextmenu.appendChild(item)
  }
  contextmenu.style.top = `${y}px`
  contextmenu.style.left = `${x}px`
  contextmenu.style.display = 'block'
  resize(0, 0, false, true)
}

export function hideContextmenu () {
  contextmenu.innerHTML = ''
  contextmenu.style.display = 'none'
}

document.addEventListener('mousedown', e => {
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

document.addEventListener('mousemove', e => {
  if (e.button !== 0 || !pressed) {
    return
  }
  hideContextmenu()
  dragging = true
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  dX += dx
  dY += dy
  dragOffset = Math.max(dragOffset, dX * dX + dY * dY)
  // minus because macOS has bottom-left (0, 0)
  resize(dx, -dy, true, false)
})

document.addEventListener('mouseup', e => {
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
      return window._page(false)
    } else if (target.classList.contains('fcitx-next')) {
      return window._page(true)
    } else if (target.classList.contains('fcitx-expand')) {
      return expand()
    }
    target = target.parentElement!
  }
  const i = getCandidateIndex(target)
  if (i >= 0) {
    return window._select(i)
  }
})

let actions: CandidateAction[][] = []
export function setActions (newActions: CandidateAction[][]) {
  actions = newActions
}

let actionX = 0
let actionY = 0
let actionIndex = 0

export function answerActions (actions: CandidateAction[]) {
  showContextmenu(actionX, actionY, actionIndex, actions)
}

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
  if (i >= 0 && getScrollState() === 2) {
    actionX = e.clientX
    actionY = e.clientY
    actionIndex = i
    return window._askActions(i)
  }
  if (i >= 0 && actions[i].length > 0) {
    showContextmenu(e.clientX, e.clientY, i, actions[i])
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
const panelBlurOuter = document.querySelector('.fcitx-panel-blur-outer')!
const panelBlurInner = document.querySelector('.fcitx-panel-blur-inner')!
function redrawBlur () {
  if (!blurEnabled || !theme.classList.contains('fcitx-macos')) {
    return
  }
  if (blurSwitch) {
    panelBlurOuter.classList.add('fcitx-blur')
    panelBlurInner.classList.remove('fcitx-blur')
  } else {
    panelBlurInner.classList.add('fcitx-blur')
    panelBlurOuter.classList.remove('fcitx-blur')
  }
  blurSwitch = !blurSwitch
}
setInterval(redrawBlur, 40)

export function showCursor (show: boolean) {
  const cursor = document.querySelector('.fcitx-cursor')
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

export type PAGING_BUTTONS_STYLE = 'None' | 'Arrow' | 'Triangle'
let pagingButtonsStyle: PAGING_BUTTONS_STYLE = 'Arrow'
export function setPagingButtonsStyle (style: PAGING_BUTTONS_STYLE) {
  pagingButtonsStyle = style
}
export function getPagingButtonsStyle () {
  return pagingButtonsStyle
}
