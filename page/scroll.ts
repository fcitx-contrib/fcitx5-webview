import { COLLAPSE, COMMIT, DOWN, END, HOME, LEFT, PAGE_DOWN, PAGE_UP, RIGHT, SCROLL_NONE, SCROLL_READY, UP } from './constant'
import {
  hoverables,
} from './selector'
import {
  hideContextmenu,
  resizeForAnimation,
} from './ux'

let MAX_ROW = 6
let MAX_COLUMN = 6
let UNIT_WIDTH = 65 // Math.floor((400 - 8)/MAX_COLUMN)
let ROW_HEIGHT = 28

export function setScrollParams(row: number, column: number, width: number, height: number) {
  MAX_ROW = row
  MAX_COLUMN = column
  UNIT_WIDTH = width
  ROW_HEIGHT = height
}

let animation = true
let collapseHeight = 0

export function setAnimation(enable: boolean) {
  animation = enable
}

let scrollState: SCROLL_STATE = SCROLL_NONE

export function getScrollState() {
  return scrollState
}

export function setScrollState(state: SCROLL_STATE) {
  scrollState = state
}

let scrollEnd = false

export function setScrollEnd(end: boolean) {
  scrollEnd = end
}

// A lock that prevents fetching same candidates simultaneously.
let fetching = false

export function fetchComplete() {
  fetching = false
}

export function expand() {
  window.fcitx._scroll(0, (MAX_ROW + 1) * MAX_COLUMN) // visible rows plus 1 hidden row
}

function collapse() {
  if (animation) {
    hoverables.style.maxBlockSize = `${collapseHeight}px`
    setTimeout(() => {
      window.fcitx._scroll(-1, 0)
    }, 290) // Less than 300ms to give engine some time to generate candidates.
  }
  else {
    window.fcitx._scroll(-1, 0)
  }
}

let rowItemCount: number[] = []
let highlighted = 0

function itemCountInFirstNRows(n: number): number {
  return rowItemCount.slice(0, n).reduce((sum, count) => sum + count, 0)
}

function getRowOf(index: number): number {
  let skipped = 0
  for (let i = 0; i < rowItemCount.length - 1; ++i) {
    const end = skipped + rowItemCount[i]
    if (index < end) {
      return i
    }
    skipped = end
  }
  return rowItemCount.length - 1
}

function getHighlightedRow(): number {
  return getRowOf(highlighted)
}

function distanceToTop(element: Element, basis: 'top' | 'bottom') {
  return element.getBoundingClientRect()[basis] - hoverables.getBoundingClientRect().top
}

function scrollForHighlight() {
  const candidates = hoverables.querySelectorAll('.fcitx-candidate')

  const bottomOffset = distanceToTop(candidates[highlighted], 'bottom') - hoverables.clientHeight
  // Highlighted candidate below bottom of panel
  if (bottomOffset > 0) {
    hoverables.scrollTop += bottomOffset
  }

  const topOffset = distanceToTop(candidates[highlighted], 'top')
  // Highlighted candidate above top of panel
  if (topOffset < 0) {
    hoverables.scrollTop += topOffset
  }
}

function renderHighlightAndLabels(newHighlighted: number, clearOld: boolean) {
  window.fcitx._highlight(newHighlighted) // Call it on both expand and highlight move.
  const candidates = hoverables.querySelectorAll('.fcitx-candidate')
  if (clearOld) {
    const highlightedRow = getHighlightedRow()
    const skipped = itemCountInFirstNRows(highlightedRow)
    for (let i = skipped; i < skipped + rowItemCount[highlightedRow]; ++i) {
      const candidate = candidates[i]
      candidate.classList.remove('fcitx-highlighted-row')
      candidate.querySelector('.fcitx-label')!.innerHTML = '0'
    }
    candidates[highlighted].classList.remove('fcitx-highlighted', 'fcitx-highlighted-original')
  }

  highlighted = newHighlighted

  const highlightedRow = getHighlightedRow()
  const skipped = itemCountInFirstNRows(highlightedRow)
  for (let i = skipped; i < skipped + rowItemCount[highlightedRow]; ++i) {
    const candidate = candidates[i]
    candidate.classList.add('fcitx-highlighted-row')
    candidate.querySelector('.fcitx-label')!.innerHTML = `${(i - skipped + 1) % 10}`
  }
  candidates[highlighted].classList.add('fcitx-highlighted', 'fcitx-highlighted-original')
}

export function recalculateScroll(scrollStart: boolean) {
  const candidates = hoverables.querySelectorAll('.fcitx-candidate')
  rowItemCount = []
  let itemCount = 0
  let unitCount = 0
  for (const candidate of candidates) {
    candidate.classList.remove('fcitx-highlighted-row')
    const { width } = candidate.getBoundingClientRect()
    const nUnits = Math.min(Math.ceil(width / UNIT_WIDTH), MAX_COLUMN)
    candidate.setAttribute('style', `width: ${nUnits * UNIT_WIDTH}px`)
    unitCount += nUnits
    if (unitCount <= MAX_COLUMN) {
      ++itemCount
    }
    else {
      rowItemCount.push(itemCount)
      candidate.previousElementSibling?.setAttribute('style', 'flex-grow: 1')
      itemCount = 1
      unitCount = nUnits
    }
  }
  rowItemCount.push(itemCount)
  renderHighlightAndLabels(scrollStart ? 0 : highlighted, !scrollStart)
}

function getNeighborCandidate(index: number, direction: SCROLL_MOVE_HIGHLIGHT): number {
  const row = getRowOf(index)
  const candidates = hoverables.querySelectorAll('.fcitx-candidate')
  const { left, right } = candidates[index].getBoundingClientRect()
  const mid = (left + right) / 2

  function helper(row: number) {
    if (row < 0 || row === rowItemCount.length) {
      return -1
    }
    const skipped = itemCountInFirstNRows(row)
    const last = skipped + rowItemCount[row] - 1
    for (let i = skipped; i < last; ++i) {
      const rect = candidates[i].getBoundingClientRect()
      if (rect.right <= left) {
        continue
      }
      return rect.right > mid || rect.right - left > left - rect.left ? i : i + 1
    }
    return last
  }

  switch (direction) {
    case UP: {
      return helper(row - 1)
    }
    case DOWN: {
      return helper(row + 1)
    }
    case LEFT:
      return index - 1
    case RIGHT:
      if (index + 1 < itemCountInFirstNRows(rowItemCount.length + 1)) {
        return index + 1
      }
      return -1
    case HOME:
    case END: {
      const skipped = itemCountInFirstNRows(row)
      return direction === HOME ? skipped : skipped + rowItemCount[row] - 1
    }
    case PAGE_UP:
    case PAGE_DOWN: {
      const d = direction === PAGE_UP ? UP : DOWN
      let step = MAX_ROW
      let intermediateIndex = index
      let newIndex: number
      do {
        newIndex = intermediateIndex
        intermediateIndex = getNeighborCandidate(intermediateIndex, d) // execute at most MAX_ROW times, but the last result is not assigned to newIndex
      } while (intermediateIndex >= 0 && --step)
      if (newIndex === index) {
        return -1
      }
      return newIndex
    }
  }
}

export function scrollKeyAction(action: SCROLL_KEY_ACTION) {
  hideContextmenu()
  if (action >= 0 && action <= 9) {
    const offset = (action + 9) % 10
    const highlightedRow = getHighlightedRow()
    const n = rowItemCount[highlightedRow]
    if (offset >= n) {
      return
    }
    return window.fcitx._select(itemCountInFirstNRows(highlightedRow) + offset)
  }
  switch (action) {
    case UP:
    case DOWN:
    case LEFT:
    case RIGHT:
    case HOME:
    case END:
    case PAGE_UP:
    case PAGE_DOWN: {
      const newHighlighted = getNeighborCandidate(highlighted, action)
      if (newHighlighted >= 0) {
        renderHighlightAndLabels(newHighlighted, true)
        scrollForHighlight()
        if (!scrollEnd && !fetching) {
          const newHighlightedRow = getHighlightedRow()
          if (rowItemCount.length - newHighlightedRow <= MAX_ROW) {
            fetching = true
            window.fcitx._scroll(itemCountInFirstNRows(rowItemCount.length), MAX_ROW * MAX_COLUMN)
          }
        }
      }
      else if ([UP, PAGE_UP].includes(action) && getHighlightedRow() === 0) {
        collapse()
      }
      break
    }
    case COLLAPSE:
      collapse()
      break
    case COMMIT:
      window.fcitx._select(highlighted)
      break
  }
}

hoverables.addEventListener('scroll', () => {
  if (scrollEnd || fetching) {
    return
  }
  // This is safe since there are at least 2 lines.
  const bottomRightIndex = itemCountInFirstNRows(rowItemCount.length - 1) - 1
  const candidates = hoverables.querySelectorAll('.fcitx-candidate')
  const bottomRight = candidates[bottomRightIndex]
  if (distanceToTop(bottomRight, 'top') < hoverables.clientHeight) {
    fetching = true
    window.fcitx._scroll(candidates.length, MAX_ROW * MAX_COLUMN)
  }
})

// Expand/collapse animation. Sync with native window for position, size and blur.
const resizeObserver = new ResizeObserver((entries) => {
  if (scrollState === SCROLL_READY) {
    collapseHeight = Math.max(ROW_HEIGHT, entries[0].contentRect.height /* may be 0 so trust it only if a candidate has multiple lines */)
    // Set max-block-size as the actual value to enable expand animation.
    hoverables.style.maxBlockSize = `${collapseHeight}px`
  }
  resizeForAnimation()
})
resizeObserver.observe(hoverables)
