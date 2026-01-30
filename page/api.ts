import { HORIZONTAL, SCROLLING, VERTICAL } from './constant'
import { setStyle } from './customize'
import { log } from './log'
import { hidePanel, moveHighlight, setCandidates, updateInputPanel } from './panel'
import { loadPlugins, pluginManager, unloadPlugins } from './plugin'
import { getScrollState, scrollKeyAction } from './scroll'
import { hoverables, panel } from './selector'
import { setAccentColor, setTheme } from './theme'
import { answerActions, getHoverBehavior, resize } from './ux'
import './distribution'

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
  window.fcitx('copyHTML', html)
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
  window.fcitx('page', e.deltaY > 0)
})

// JavaScript APIs that webview_candidate_window.cpp calls
window.fcitx.setCandidates = setCandidates
window.fcitx.setLayout = setLayout
window.fcitx.updateInputPanel = updateInputPanel
window.fcitx.hidePanel = hidePanel
window.fcitx.resize = resize
window.fcitx.setTheme = setTheme
window.fcitx.setAccentColor = setAccentColor
window.fcitx.setStyle = setStyle
window.fcitx.setWritingMode = setWritingMode
window.fcitx.copyHTML = copyHTML
window.fcitx.scrollKeyAction = scrollKeyAction
window.fcitx.answerActions = answerActions

Object.defineProperty(window.fcitx, 'pluginManager', {
  value: pluginManager,
})

Object.defineProperty(window.fcitx, 'loadPlugins', {
  value: loadPlugins,
})

Object.defineProperty(window.fcitx, 'unloadPlugins', {
  value: unloadPlugins,
})

window.fcitx.log = log
setTheme(0)
window.fcitx('onload')
