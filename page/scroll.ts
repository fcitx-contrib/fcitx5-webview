import {
  hoverables
} from './selector'

let scrollState: SCROLL_STATE = 0

export function getScrollState () {
  return scrollState
}

export function setScrollState (state: SCROLL_STATE) {
  scrollState = state
}

let scrollEnd = false

export function setScrollEnd (end: boolean) {
  scrollEnd = end
}

let rowItemCount: number[] = []
let highlighted = 0

function itemCountInFirstNRows (n: number): number {
  return rowItemCount.slice(0, n).reduce((sum, count) => sum + count, 0)
}

function getHighlightedRow (): number {
  let skipped = 0
  for (let i = 0; i < rowItemCount.length - 1; ++i) {
    const end = skipped + rowItemCount[i]
    if (highlighted < end) {
      return i
    }
    skipped = end
  }
  return rowItemCount.length - 1
}

function distanceToTop (element: Element, basis: 'top' | 'bottom') {
  return element.getBoundingClientRect()[basis] - hoverables.getBoundingClientRect().top
}

function renderHighlightAndLabels (newHighlighted: number, clearOld: boolean) {
  const candidates = hoverables.querySelectorAll('.candidate')
  if (clearOld) {
    const highlightedRow = getHighlightedRow()
    const skipped = itemCountInFirstNRows(highlightedRow)
    for (let i = skipped; i < skipped + rowItemCount[highlightedRow]; ++i) {
      const candidate = candidates[i]
      candidate.classList.remove('highlighted-row')
      candidate.querySelector('.label')!.innerHTML = '0'
    }
    candidates[highlighted].classList.remove('highlighted')
  }

  highlighted = newHighlighted

  const highlightedRow = getHighlightedRow()
  const skipped = itemCountInFirstNRows(highlightedRow)
  for (let i = skipped; i < skipped + rowItemCount[highlightedRow]; ++i) {
    const candidate = candidates[i]
    candidate.classList.add('highlighted-row')
    candidate.querySelector('.label')!.innerHTML = `${i - skipped + 1}`
  }
  candidates[highlighted].classList.add('highlighted')

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

export function recalculateScroll (scrollStart: boolean) {
  const candidates = hoverables.querySelectorAll('.candidate')
  let currentY = candidates[0].getBoundingClientRect().y
  rowItemCount = []
  let itemCount = 0
  for (const candidate of candidates) {
    candidate.classList.remove('highlighted-row')
    const { y } = candidate.getBoundingClientRect()
    if (y === currentY) {
      ++itemCount
    } else {
      rowItemCount.push(itemCount)
      itemCount = 1
      currentY = y
    }
  }
  rowItemCount.push(itemCount)
  renderHighlightAndLabels(scrollStart ? 0 : highlighted, !scrollStart)
}

function getNeighborCandidate (direction: SCROLL_MOVE_HIGHLIGHT): number {
  const highlightedRow = getHighlightedRow()
  const candidates = hoverables.querySelectorAll('.candidate')
  const { left, right } = candidates[highlighted].getBoundingClientRect()
  const mid = (left + right) / 2

  function helper (row: number) {
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
    case 10: {
      return helper(highlightedRow - 1)
    }
    case 11: {
      return helper(highlightedRow + 1)
    }
    case 12:
      return highlighted - 1
    case 13:
      if (highlighted + 1 < itemCountInFirstNRows(rowItemCount.length + 1)) {
        return highlighted + 1
      }
      return -1
  }
  return -1
}

export function scrollKeyAction (action: SCROLL_KEY_ACTION) {
  if (action >= 1 && action <= 6) {
    const highlightedRow = getHighlightedRow()
    const n = rowItemCount[highlightedRow]
    if (action > n) {
      return
    }
    return window._select(itemCountInFirstNRows(highlightedRow) + action - 1)
  }
  switch (action) {
    case 10:
    case 11:
    case 12:
    case 13: {
      const newHighlighted = getNeighborCandidate(action)
      if (newHighlighted >= 0) {
        renderHighlightAndLabels(newHighlighted, true)
        if (!scrollEnd && !fetching) {
          const newHighlightedRow = getHighlightedRow()
          if (rowItemCount.length - newHighlightedRow <= 6) {
            fetching = true
            window._scroll(itemCountInFirstNRows(rowItemCount.length), 36)
          }
        }
      }
      break
    }
  }
}

// A lock that prevents fetching same candidates simultaneously.
let fetching = false

export function fetchComplete () {
  fetching = false
}

hoverables.addEventListener('scroll', () => {
  if (scrollEnd || fetching) {
    return
  }
  // This is safe since there are at least 7 lines.
  const bottomRightIndex = itemCountInFirstNRows(rowItemCount.length - 1) - 1
  const candidates = hoverables.querySelectorAll('.candidate')
  const bottomRight = candidates[bottomRightIndex]
  if (distanceToTop(bottomRight, 'top') < hoverables.clientHeight) {
    fetching = true
    window._scroll(candidates.length, 36)
  }
})
