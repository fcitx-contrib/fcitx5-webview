import { setBlur } from './ux'

type CONFIG_BOOL = 'False' | 'True'

type LIGHT_MODE = {
  OverrideDefault: CONFIG_BOOL
  HighlightColor: string
  HighlightTextColor: string
  HighlightLabelColor: string
  PanelColor: string
  TextColor: string
  LabelColor: string
  PreeditColor: string
  BorderColor: string
  HorizontalDividerColor: string
}

type FONT_FAMILY = {[key: string]: string}

type STYLE_JSON = {
  LightMode: LIGHT_MODE,
  DarkMode: LIGHT_MODE & {
    SameWithLightMode: CONFIG_BOOL
  }
  Background: {
    ImageUrl: string
    Blur: CONFIG_BOOL
    BlurRadius: string
    Shadow: CONFIG_BOOL
  }
  Font: {
    TextFontFamily: FONT_FAMILY
    TextFontSize: string
    LabelFontFamily: FONT_FAMILY
    LabelFontSize: string
    PreeditFontFamily: FONT_FAMILY
    PreeditFontSize: string
  }
  BorderWidth: string
  BorderRadius: string
  HorizontalDividerWidth: string
}

const PANEL = '.panel.basic'
const HORIZONTAL_DIVIDER = '.candidates.vertical .candidate:not(:first-child)'
const PANEL_HORIZONTAL_DIVIDER = `${PANEL} ${HORIZONTAL_DIVIDER}`
const CANDIDATES = `${PANEL} .candidates`
const LABEL = `${PANEL} .label`
const TEXT = `${PANEL} .text`
const PREEDIT = `${PANEL} .preedit`

const PANEL_LIGHT = `${PANEL}.light`
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted`
const TEXT_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted .text`
const LABEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted .label`
const TEXT_LIGHT = `${PANEL_LIGHT} .text`
const LABEL_LIGHT = `${PANEL_LIGHT} .label`
const PREEDIT_LIGHT = `${PANEL_LIGHT} .preedit`
const HEADER_LIGHT_BACKGROUND = `${PANEL_LIGHT} .header`
const CANDIDATE_LIGHT_BACKGROUND = `${PANEL_LIGHT} .candidate`
const PANEL_LIGHT_HORIZONTAL_DIVIDER = `${PANEL_LIGHT} ${HORIZONTAL_DIVIDER}`

const PANEL_DARK = `${PANEL}.dark`
const PANEL_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted`
const TEXT_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted .text`
const LABEL_DARK_HIGHLIGHT = `${PANEL_DARK} .candidate.highlighted .label`
const TEXT_DARK = `${PANEL_DARK} .text`
const LABEL_DARK = `${PANEL_DARK} .label`
const PREEDIT_DARK = `${PANEL_DARK} .preedit`
const HEADER_DARK_BACKGROUND = `${PANEL_DARK} .header`
const CANDIDATE_DARK_BACKGROUND = `${PANEL_DARK} .candidate`
const PANEL_DARK_HORIZONTAL_DIVIDER = `${PANEL_DARK} ${HORIZONTAL_DIVIDER}`

function px (n: string) {
  return `${n}px`
}

function setFontFamily (o: {[key: string]: string}, f: FONT_FAMILY) {
  const fontFamily = Object.values(f).filter(s => s.trim().length > 0).map(s => JSON.stringify(s.trim()))
  if (fontFamily.length > 0) {
    o['font-family'] = fontFamily.join(', ')
  }
}

export function setStyle (style: string) {
  const j = JSON.parse(style) as STYLE_JSON
  const rules: {[key: string]: {[key: string]: string}} = {}
  const hasBackgroundImage = j.Background.ImageUrl.trim() !== ''
  rules[PANEL] = {}
  rules[CANDIDATES] = {}
  rules[TEXT] = {}
  rules[LABEL] = {}
  rules[PREEDIT] = {}

  if (j.LightMode.OverrideDefault === 'True') {
    rules[PANEL_LIGHT_HIGHLIGHT] = {
      'background-color': j.LightMode.HighlightColor
    }
    rules[TEXT_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightTextColor
    }
    rules[LABEL_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightLabelColor
    }
    rules[HEADER_LIGHT_BACKGROUND] = {
      'background-color': j.LightMode.PanelColor
    }
    rules[CANDIDATE_LIGHT_BACKGROUND] = {
      // With background image, discard panel color for unselected candidates
      'background-color': hasBackgroundImage ? 'inherit' : j.LightMode.PanelColor
    }
    rules[TEXT_LIGHT] = {
      color: j.LightMode.TextColor
    }
    rules[LABEL_LIGHT] = {
      color: j.LightMode.LabelColor
    }
    rules[PREEDIT_LIGHT] = {
      color: j.LightMode.PreeditColor
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
      rules[TEXT_DARK_HIGHLIGHT] = rules[TEXT_LIGHT_HIGHLIGHT]
      rules[LABEL_DARK_HIGHLIGHT] = rules[LABEL_LIGHT_HIGHLIGHT]
      rules[HEADER_DARK_BACKGROUND] = rules[HEADER_LIGHT_BACKGROUND]
      rules[CANDIDATE_DARK_BACKGROUND] = rules[CANDIDATE_LIGHT_BACKGROUND]
      rules[TEXT_DARK] = rules[TEXT_LIGHT]
      rules[LABEL_DARK] = rules[LABEL_LIGHT]
      rules[PREEDIT_DARK] = rules[PREEDIT_LIGHT]
      rules[PANEL_DARK] = rules[PANEL_LIGHT]
      rules[PANEL_DARK_HORIZONTAL_DIVIDER] = rules[PANEL_LIGHT_HORIZONTAL_DIVIDER]
    } else {
      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[TEXT_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightTextColor
      }
      rules[LABEL_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightLabelColor
      }
      rules[HEADER_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor
      }
      rules[CANDIDATE_DARK_BACKGROUND] = {
        'background-color': hasBackgroundImage ? 'inherit' : j.DarkMode.PanelColor
      }
      rules[TEXT_DARK] = {
        color: j.DarkMode.TextColor
      }
      rules[LABEL_DARK] = {
        color: j.DarkMode.LabelColor
      }
      rules[PREEDIT_DARK] = {
        color: j.DarkMode.PreeditColor
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
    rules[CANDIDATES]['background-image'] = `url(${JSON.stringify(j.Background.ImageUrl)})`
    rules[CANDIDATES]['background-size'] = 'cover'
  }

  if (j.Background.Blur === 'True') {
    setBlur(true)
    rules['.blur'] = { '-webkit-backdrop-filter': `blur(${px(j.Background.BlurRadius)})` }
  } else {
    setBlur(false)
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
  }

  if (j.Background.Shadow === 'False') {
    rules[PANEL]['box-shadow'] = 'none'
  }

  setFontFamily(rules[TEXT], j.Font.TextFontFamily)
  rules[TEXT]['font-size'] = px(j.Font.TextFontSize)

  setFontFamily(rules[LABEL], j.Font.LabelFontFamily)
  rules[LABEL]['font-size'] = px(j.Font.LabelFontSize)

  setFontFamily(rules[PREEDIT], j.Font.PreeditFontFamily)
  rules[PREEDIT]['font-size'] = px(j.Font.PreeditFontSize)

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
