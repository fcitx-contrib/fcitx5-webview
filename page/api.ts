import { HORIZONTAL, SCROLLING, VERTICAL } from './constant'
import { fcitx } from './distribution'
// Must be put after fcitx import.
import { setStyle } from './customize' // eslint-disable-line perfectionist/sort-imports
import { fcitxLog } from './log'
import { hidePanel, moveHighlight, setCandidates, updateInputPanel } from './panel'
import { loadPlugins, pluginManager, unloadPlugins } from './plugin'
import { getScrollState, scrollKeyAction } from './scroll'
import { hoverables, panel } from './selector'
import { setAccentColor, setTheme } from './theme'
import { answerActions, getHoverBehavior, resize } from './ux'

function setLayout(layout: LAYOUT) {
  switch (layout) {
    case HORIZONTAL:
      hoverables.classList.remove('fcitx-vertical')
      hoverables.classList.add('fcitx-horizontal')
      break
    case VERTICAL:
      hoverables.classList.remove('fcitx-horizontal')
      hoverables.classList.add('fcitx-vertical')
      break
  }
}

function setWritingMode(mode: WRITING_MODE) {
  const classes = ['fcitx-horizontal-tb', 'fcitx-vertical-rl', 'fcitx-vertical-lr']
  for (let i = 0; i < classes.length; ++i) {
    if (mode === i) {
      panel.classList.add(classes[i])
    }
    else {
      panel.classList.remove(classes[i])
    }
  }
}

function copyHTML() {
  const html = document.documentElement.outerHTML
  fcitx._copyHTML(html)
}

hoverables.addEventListener('mouseleave', () => {
  const hoverBehavior = getHoverBehavior()
  if (hoverBehavior === 'Move') {
    const lastHighlighted = hoverables.querySelector('.fcitx-highlighted')
    const originalHighlighted = hoverables.querySelector('.fcitx-highlighted-original')
    moveHighlight(lastHighlighted, originalHighlighted)
  }
})

hoverables.addEventListener('wheel', (e) => {
  if (getScrollState() === SCROLLING) {
    return
  }
  fcitx._page(e.deltaY > 0)
})

// JavaScript APIs that webview_candidate_window.cpp calls
fcitx.setCandidates = setCandidates
fcitx.setLayout = setLayout
fcitx.updateInputPanel = updateInputPanel
fcitx.hidePanel = hidePanel
fcitx.resize = resize
fcitx.setTheme = setTheme
fcitx.setAccentColor = setAccentColor
fcitx.setStyle = setStyle
fcitx.setWritingMode = setWritingMode
fcitx.copyHTML = copyHTML
fcitx.scrollKeyAction = scrollKeyAction
fcitx.answerActions = answerActions

Object.defineProperty(fcitx, 'pluginManager', {
  value: pluginManager,
})

Object.defineProperty(fcitx, 'loadPlugins', {
  value: loadPlugins,
})

Object.defineProperty(fcitx, 'unloadPlugins', {
  value: unloadPlugins,
})

fcitx.fcitxLog = fcitxLog
// needed when JS execution is async with C++ (macOS)
fcitx._onload && fcitx._onload()
setTheme(0)
