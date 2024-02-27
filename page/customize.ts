import { setBlur } from './ux'

type CONFIG_BOOL = 'False' | 'True'

type LIGHT_MODE = {
  OverrideDefault: CONFIG_BOOL
  HighlightColor: string
  PanelColor: string
  BorderColor: string
  HorizontalDividerColor: string
}

type STYLE_JSON = {
  LightMode: LIGHT_MODE,
  DarkMode: LIGHT_MODE & {
    SameWithLightMode: CONFIG_BOOL
  }
  BackgroundBlur: CONFIG_BOOL
  BlurRadius: string
  Shadow: CONFIG_BOOL
  BorderWidth: string
  BorderRadius: string
  HorizontalDividerWidth: string
}

const PANEL = '.panel.basic'
const HORIZONTAL_DIVIDER = '.candidates.vertical .candidate:not(:first-child)'
const PANEL_HORIZONTAL_DIVIDER = `${PANEL} ${HORIZONTAL_DIVIDER}`

const PANEL_LIGHT = `${PANEL}.light`
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted`
const PANEL_LIGHT_BACKGROUND = `${PANEL_LIGHT} .candidate, ${PANEL_LIGHT} .header`
const PANEL_LIGHT_HORIZONTAL_DIVIDER = `${PANEL_LIGHT} ${HORIZONTAL_DIVIDER}`

const PANEL_DARK = `${PANEL}.dark`
const PANEL_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted`
const PANEL_DARK_BACKGROUND = `${PANEL_DARK} .candidate, ${PANEL_DARK} .header`
const PANEL_DARK_HORIZONTAL_DIVIDER = `${PANEL_DARK} ${HORIZONTAL_DIVIDER}`

function px (n: string) {
  return `${n}px`
}

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
    rules[PANEL_LIGHT] = {
      'border-color': j.LightMode.BorderColor
    }
    rules[PANEL_LIGHT_HORIZONTAL_DIVIDER] = {
      'border-top-color': j.LightMode.HorizontalDividerColor
    }
  }

  if (j.DarkMode.OverrideDefault === 'True') {
    if (j.DarkMode.SameWithLightMode === 'True' && j.LightMode.OverrideDefault === 'True') {
      rules[PANEL_DARK_HIGHLIGHT] = rules[PANEL_LIGHT_HIGHLIGHT]
      rules[PANEL_DARK_BACKGROUND] = rules[PANEL_LIGHT_BACKGROUND]
      rules[PANEL_DARK] = rules[PANEL_LIGHT]
      rules[PANEL_DARK_HORIZONTAL_DIVIDER] = rules[PANEL_LIGHT_HORIZONTAL_DIVIDER]
    } else {
      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[PANEL_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor
      }
      rules[PANEL_DARK] = {
        'border-color': j.DarkMode.BorderColor
      }
      rules[PANEL_DARK_HORIZONTAL_DIVIDER] = {
        'border-top-color': j.DarkMode.HorizontalDividerColor
      }
    }
  }

  if (j.BackgroundBlur === 'True') {
    setBlur(true)
    rules['.blur'] = { '-webkit-backdrop-filter': `blur(${px(j.BlurRadius)})` }
  } else {
    setBlur(false)
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
  }

  if (j.Shadow === 'False') {
    rules[PANEL]['box-shadow'] = 'none'
  }

  rules[PANEL]['border-width'] = px(j.BorderWidth)
  rules[PANEL]['border-radius'] = px(j.BorderRadius)
  rules[PANEL_HORIZONTAL_DIVIDER] = {
    'border-top-width': px(j.HorizontalDividerWidth)
  }

  const basic = document.head.querySelector('#basic')
  if (basic) {
    basic.innerHTML = Object.entries(rules).map(([selector, block]) =>
      `${selector} {` + Object.entries(block).map(([key, value]) =>
        `${key}: ${value};`).join('\n') + '}').join('\n')
  }
}
