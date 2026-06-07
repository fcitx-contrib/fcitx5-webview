/// <reference path="./global.d.ts" />
// @ts-expect-error parcel bundle-text prefix
import css from 'bundle-text:./style.scss'
import { HORIZONTAL, VERTICAL } from './constant'
import { setStyle } from './customize'
import { initDistribution } from './distribution'
import { log } from './log'
import { hidePanel, setCandidates, updateInputPanel } from './panel'
import { loadPlugins, pluginManager, unloadPlugins } from './plugin'
import { initScroll, scrollKeyAction } from './scroll'
import { hoverables, initSelectors, panel } from './selector'
import { setAccentColor, setTheme } from './theme'
import { answerActions, initUx, resize } from './ux'

function setLayout(layout: 0 | 1) {
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

function setWritingMode(mode: 0 | 1 | 2) {
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

export function initPanel(container: HTMLElement) {
  initDistribution()

  if (!document.head.querySelector('#fcitx-style')) {
    const style = document.createElement('style')
    style.id = 'fcitx-style'
    style.textContent = css
    document.head.append(style)
  }

  // The last child of fcitx-decoration is the highest.
  container.insertAdjacentHTML('beforeend', `
    <div id="fcitx-theme" class="fcitx-blue fcitx-macos fcitx-macos-15 fcitx-macos-26">
      <div class="fcitx-decoration">
        <div class="fcitx-panel-topleft"></div>
        <div class="fcitx-panel-top"></div>
        <div class="fcitx-panel-topright"></div>
        <div class="fcitx-panel-left"></div>
        <div class="fcitx-panel-right"></div>
        <div class="fcitx-panel-bottomleft"></div>
        <div class="fcitx-panel-bottom"></div>
        <div class="fcitx-panel-bottomright"></div>
        <div class="fcitx-panel-center">
          <div class="fcitx-panel fcitx-horizontal-tb">
            <div class="fcitx-panel-blur">
              <div class="fcitx-header">
                <div class="fcitx-aux-up fcitx-hidden"></div>
                <div class="fcitx-preedit fcitx-hidden">
                  <div class="fcitx-pre-caret"></div>
                  <div class="fcitx-caret"></div>
                  <div class="fcitx-post-caret"></div>
                </div>
              </div>
              <div class="fcitx-aux-down fcitx-hidden"></div>
              <div class="fcitx-hoverables fcitx-horizontal"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="fcitx-contextmenu fcitx-blur"></div>
    </div>
  `)
  initSelectors(container)
  initUx()
  initScroll()

  // Bind APIs to window.fcitx for C++ calls (macOS & Emscripten)
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
  window.fcitx.log = log

  Object.defineProperty(window.fcitx, 'pluginManager', {
    value: pluginManager,
  })

  Object.defineProperty(window.fcitx, 'loadPlugins', {
    value: loadPlugins,
  })

  Object.defineProperty(window.fcitx, 'unloadPlugins', {
    value: unloadPlugins,
  })

  setTheme(0)
  window.fcitx('onload')
}
