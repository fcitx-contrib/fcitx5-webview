import { setBlur } from './ux'

type CONFIG_BOOL = 'False' | 'True'

type STYLE_JSON = {
  LightMode: {
    OverrideDefault: CONFIG_BOOL
    HighlightColor: string
    PanelColor: string
  }
  DarkMode: {
    OverrideDefault: CONFIG_BOOL
    SameWithLightMode: CONFIG_BOOL
    HighlightColor: string
    PanelColor: string
  }
  BackgroundBlur: CONFIG_BOOL
  BlurRadius: string
  Shadow: CONFIG_BOOL
}

const PANEL = '.panel.basic'

const PANEL_LIGHT = `${PANEL}.light`
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted`
const PANEL_LIGHT_BACKGROUND = `${PANEL_LIGHT} .candidate, ${PANEL_LIGHT} .header`

const PANEL_DARK = `${PANEL}.dark`
const PANEL_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted`
const PANEL_DARK_BACKGROUND = `${PANEL_DARK} .candidate, ${PANEL_DARK} .header`

export function setStyle (style: string) {
  const j = JSON.parse(style) as STYLE_JSON
  const rules: {[key: string]: {[key: string]: string}} = {}
  rules[PANEL] = {}

  if (j.LightMode.OverrideDefault === 'True') {
    rules[PANEL_LIGHT_HIGHLIGHT] = {
      'background-color': j.LightMode.HighlightColor
    }
    rules[PANEL_LIGHT_BACKGROUND] = {
      'background-color': j.LightMode.PanelColor
    }
  }

  if (j.DarkMode.OverrideDefault === 'True') {
    if (j.DarkMode.SameWithLightMode === 'True' && j.LightMode.OverrideDefault === 'True') {
      rules[PANEL_DARK_HIGHLIGHT] = rules[PANEL_LIGHT_HIGHLIGHT]
      rules[PANEL_DARK_BACKGROUND] = rules[PANEL_LIGHT_BACKGROUND]
    } else {
      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[PANEL_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor
      }
    }
  }

  if (j.BackgroundBlur === 'True') {
    setBlur(true)
    rules['.blur'] = { '-webkit-backdrop-filter': `blur(${j.BlurRadius}px)` }
  } else {
    setBlur(false)
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
  }

  if (j.Shadow === 'False') {
    rules[PANEL]['box-shadow'] = 'none'
  }

  const basic = document.head.querySelector('#basic')
  if (basic) {
    basic.innerHTML = Object.entries(rules).map(([selector, block]) =>
      `${selector} {` + Object.entries(block).map(([key, value]) =>
        `${key}: ${value};`).join('\n') + '}').join('\n')
  }
}
