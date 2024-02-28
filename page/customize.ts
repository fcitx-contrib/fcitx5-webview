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
  Background: {
    ImageUrl: string
    Blur: CONFIG_BOOL
    BlurRadius: string
  }
  Shadow: CONFIG_BOOL
  BorderWidth: string
  BorderRadius: string
  HorizontalDividerWidth: string
}

const PANEL = '.panel.basic'
const HORIZONTAL_DIVIDER = '.candidates.vertical .candidate:not(:first-child)'
const PANEL_HORIZONTAL_DIVIDER = `${PANEL} ${HORIZONTAL_DIVIDER}`
const CANDIDATES = '.candidates'

const PANEL_LIGHT = `${PANEL}.light`
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted`
const HEADER_LIGHT_BACKGROUND = `${PANEL_LIGHT} .header`
const CANDIDATE_LIGHT_BACKGROUND = `${PANEL_LIGHT} .candidate`
const PANEL_LIGHT_HORIZONTAL_DIVIDER = `${PANEL_LIGHT} ${HORIZONTAL_DIVIDER}`

const PANEL_DARK = `${PANEL}.dark`
const PANEL_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted`
const HEADER_DARK_BACKGROUND = `${PANEL_DARK} .header`
const CANDIDATE_DARK_BACKGROUND = `${PANEL_DARK} .candidate`
const PANEL_DARK_HORIZONTAL_DIVIDER = `${PANEL_DARK} ${HORIZONTAL_DIVIDER}`

function px (n: string) {
  return `${n}px`
}

export function setStyle (style: string) {
  const j = JSON.parse(style) as STYLE_JSON
  const rules: {[key: string]: {[key: string]: string}} = {}
  const hasBackgroundImage = j.Background.ImageUrl.trim() !== ''
  rules[PANEL] = {}

  if (j.LightMode.OverrideDefault === 'True') {
    rules[PANEL_LIGHT_HIGHLIGHT] = {
      'background-color': j.LightMode.HighlightColor
    }
    rules[HEADER_LIGHT_BACKGROUND] = {
      'background-color': j.LightMode.PanelColor
    }
    rules[CANDIDATE_LIGHT_BACKGROUND] = {
      // With background image, discard panel color for unselected candidates
      'background-color': hasBackgroundImage ? 'inherit' : j.LightMode.PanelColor
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
      rules[HEADER_DARK_BACKGROUND] = rules[HEADER_LIGHT_BACKGROUND]
      rules[CANDIDATE_DARK_BACKGROUND] = rules[CANDIDATE_LIGHT_BACKGROUND]
      rules[PANEL_DARK] = rules[PANEL_LIGHT]
      rules[PANEL_DARK_HORIZONTAL_DIVIDER] = rules[PANEL_LIGHT_HORIZONTAL_DIVIDER]
    } else {
      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[HEADER_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor
      }
      rules[CANDIDATE_DARK_BACKGROUND] = {
        'background-color': hasBackgroundImage ? 'inherit' : j.DarkMode.PanelColor
      }
      rules[PANEL_DARK] = {
        'border-color': j.DarkMode.BorderColor
      }
      rules[PANEL_DARK_HORIZONTAL_DIVIDER] = {
        'border-top-color': j.DarkMode.HorizontalDividerColor
      }
    }
  }

  if (j.Background.ImageUrl) {
    // Background image should not affect aux
    rules[CANDIDATES] = {
      'background-image': `url(${JSON.stringify(j.Background.ImageUrl)})`,
      'background-size': 'cover'
    }
  }

  if (j.Background.Blur === 'True') {
    setBlur(true)
    rules['.blur'] = { '-webkit-backdrop-filter': `blur(${px(j.Background.BlurRadius)})` }
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
