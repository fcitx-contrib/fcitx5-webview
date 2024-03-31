import {
  HOVER_BEHAVIOR,
  setHoverBehavior,
  setBlur,
  setBlink
} from './ux'

type CONFIG_BOOL = 'False' | 'True'

type LIGHT_MODE = {
  OverrideDefault: CONFIG_BOOL
  HighlightColor: string
  HighlightHoverColor: string
  HighlightTextColor: string
  HighlightTextPressColor: string
  HighlightLabelColor: string
  HighlightMarkColor: string
  PanelColor: string
  TextColor: string
  LabelColor: string
  PagingButtonColor: string
  DisabledPagingButtonColor: string
  PreeditColor: string
  BorderColor: string
  DividerColor: string
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
  Cursor: {
    Style: 'Blink' | 'Static' | 'Text'
  }
  Highlight: {
    MarkStyle: 'None' | 'Bar' | 'Text'
    HoverBehavior: HOVER_BEHAVIOR
  }
  Size: {
    BorderWidth: string
    BorderRadius: string
    Margin: string
    HighlightRadius: string
    TopPadding: string
    RightPadding: string
    BottomPadding: string
    LeftPadding: string
    LabelTextGap: string
    HorizontalDividerWidth: string
  }
}

function lightToDark (light: string) {
  return light.replace(PANEL_LIGHT, PANEL_DARK)
}

const PANEL = '.panel.basic'
const PANEL_HORIZONTAL_DIVIDER = `${PANEL} .hoverables.vertical .divider`
const PANEL_HORIZONTAL_DIVIDER_SIDE = `${PANEL} .hoverables.vertical .divider-side`
// left of prev paging button, same with MSPY
const PANEL_VERTICAL_DIVIDER_SIDE = `${PANEL} .hoverables.horizontal .divider-paging .divider-side`
const HOVERABLES = `${PANEL} .hoverables`
const LABEL = `${PANEL} .label`
const TEXT = `${PANEL} .text`
const PREEDIT = `${PANEL} .preedit`
const CURSOR_NO_TEXT = `${PANEL} .cursor.no-text`
const CANDIDATE_INNER = `${PANEL} .candidate-inner`
const FIRST_CANDIDATE_INNER = '.candidate-first .candidate-inner'
const LAST_CANDIDATE_INNER = '.candidate-last .candidate-inner'
const VERTICAL_CANDIDATE_INNER = `${PANEL} .hoverables.vertical .candidate-inner`
const VERTICAL_FIRST_CANDIDATE_INNER = `${PANEL} .hoverables.vertical ${FIRST_CANDIDATE_INNER}`
const VERTICAL_LAST_CANDIDATE_INNER = `${PANEL} .hoverables.vertical ${LAST_CANDIDATE_INNER}`
const HORIZONTAL_CANDIDATE_INNER = `${PANEL} .hoverables.horizontal .candidate-inner`
const HORIZONTAL_FIRST_CANDIDATE_INNER = `${PANEL} .hoverables.horizontal ${FIRST_CANDIDATE_INNER}`
const HORIZONTAL_LAST_CANDIDATE_INNER = `${PANEL} .hoverables.horizontal ${LAST_CANDIDATE_INNER}`
const PAGING_OUTER = `${PANEL} :is(.prev, .next)`
const PAGING_INNER = `${PANEL} .paging-inner`
const HIGHLIGHT_MARK = `${PANEL} .highlighted .mark`
const HIGHLIGHT_ORIGINAL_MARK = `${PANEL} .highlighted-original .mark`

const PANEL_LIGHT = `${PANEL}.light`
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .hoverable.highlighted .hoverable-inner`
const PANEL_LIGHT_HIGHLIGHT_HOVER = `${PANEL_LIGHT} .hoverable.highlighted:hover .hoverable-inner`
const PANEL_LIGHT_HIGHLIGHT_PRESS = `${PANEL_LIGHT} .hoverable.highlighted:active .hoverable-inner`
const PANEL_LIGHT_OTHER_HOVER = `${PANEL_LIGHT} .hoverable:not(.highlighted):hover .hoverable-inner`
const PANEL_LIGHT_OTHER_PRESS = `${PANEL_LIGHT} .hoverable:not(.highlighted):active .hoverable-inner`
const TEXT_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted .text`
const TEXT_LIGHT_PRESS = `${PANEL_LIGHT} .candidate:active .candidate-inner .text`
const LABEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .candidate.highlighted .label`
const TEXT_LIGHT = `${PANEL_LIGHT} .text`
const LABEL_LIGHT = `${PANEL_LIGHT} .label`
const PAGING_BUTTON_LIGHT = `${PANEL_LIGHT} .paging .hoverable-inner svg`
const PAGING_BUTTON_DISABLED_LIGHT = `${PANEL_LIGHT} .paging svg`
const PREEDIT_LIGHT = `${PANEL_LIGHT} .preedit`
const HEADER_LIGHT_BACKGROUND = `${PANEL_LIGHT} .header`
const HOVERABLES_LIGHT_BACKGROUND = `${PANEL_LIGHT} .hoverables :is(.candidate, .paging)`
const PANEL_LIGHT_DIVIDER_MIDDLE = `${PANEL_LIGHT} .hoverables .divider .divider-middle`
const PANEL_LIGHT_DIVIDER_SIDE = `${PANEL_LIGHT} .hoverables .divider .divider-side`
const CURSOR_NO_TEXT_LIGHT = `${PANEL_LIGHT} .cursor.no-text`
const HIGHLIGHT_MARK_LIGHT = `${PANEL_LIGHT} .highlighted .mark`

const PANEL_DARK = `${PANEL}.dark`
const PANEL_DARK_HIGHLIGHT = lightToDark(PANEL_LIGHT_HIGHLIGHT)
const PANEL_DARK_HIGHLIGHT_HOVER = lightToDark(PANEL_LIGHT_HIGHLIGHT_HOVER)
const PANEL_DARK_HIGHLIGHT_PRESS = lightToDark(PANEL_LIGHT_HIGHLIGHT_PRESS)
const PANEL_DARK_OTHER_HOVER = lightToDark(PANEL_LIGHT_OTHER_HOVER)
const PANEL_DARK_OTHER_PRESS = lightToDark(PANEL_LIGHT_OTHER_PRESS)
const TEXT_DARK_HIGHLIGHT = lightToDark(TEXT_LIGHT_HIGHLIGHT)
const TEXT_DARK_PRESS = lightToDark(TEXT_LIGHT_PRESS)
const LABEL_DARK_HIGHLIGHT = lightToDark(LABEL_LIGHT_HIGHLIGHT)
const TEXT_DARK = lightToDark(TEXT_LIGHT)
const LABEL_DARK = lightToDark(LABEL_LIGHT)
const PAGING_BUTTON_DARK = lightToDark(PAGING_BUTTON_LIGHT)
const PAGING_BUTTON_DISABLED_DARK = lightToDark(PAGING_BUTTON_DISABLED_LIGHT)
const PREEDIT_DARK = lightToDark(PREEDIT_LIGHT)
const HEADER_DARK_BACKGROUND = lightToDark(HEADER_LIGHT_BACKGROUND)
const HOVERABLES_DARK_BACKGROUND = lightToDark(HOVERABLES_LIGHT_BACKGROUND)
const PANEL_DARK_DIVIDER_MIDDLE = lightToDark(PANEL_LIGHT_DIVIDER_MIDDLE)
const PANEL_DARK_DIVIDER_SIDE = lightToDark(PANEL_LIGHT_DIVIDER_SIDE)
const CURSOR_NO_TEXT_DARK = lightToDark(CURSOR_NO_TEXT_LIGHT)
const HIGHLIGHT_MARK_DARK = lightToDark(HIGHLIGHT_MARK_LIGHT)

function px (n: string | number) {
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
  const markKey = j.Highlight.MarkStyle === 'Text' ? 'color' : 'background-color'
  rules[PANEL] = {}
  rules[HOVERABLES] = {}
  rules[TEXT] = {}
  rules[LABEL] = {}
  rules[PREEDIT] = {}
  rules[CURSOR_NO_TEXT] = {}
  rules[HIGHLIGHT_MARK] = {}
  rules[HIGHLIGHT_ORIGINAL_MARK] = {}
  rules[CANDIDATE_INNER] = {}
  rules[PAGING_OUTER] = {}
  rules[PAGING_INNER] = {}

  if (j.LightMode.OverrideDefault === 'True') {
    const lightBackgroundColor = hasBackgroundImage ? 'inherit' : j.LightMode.PanelColor

    rules[PANEL_LIGHT_HIGHLIGHT] = {
      'background-color': j.LightMode.HighlightColor
    }
    rules[PANEL_LIGHT_HIGHLIGHT_HOVER] = {
      'background-color': j.LightMode.HighlightHoverColor
    }
    rules[PANEL_LIGHT_HIGHLIGHT_PRESS] = {
      'background-color': j.LightMode.HighlightColor
    }
    rules[TEXT_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightTextColor
    }
    rules[TEXT_LIGHT_PRESS] = {
      color: j.LightMode.HighlightTextPressColor
    }
    rules[LABEL_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightLabelColor
    }
    rules[HEADER_LIGHT_BACKGROUND] = {
      'background-color': j.LightMode.PanelColor
    }
    rules[HOVERABLES_LIGHT_BACKGROUND] = {
      // With background image, discard panel color for unselected candidates
      'background-color': lightBackgroundColor
    }
    rules[TEXT_LIGHT] = {
      color: j.LightMode.TextColor
    }
    rules[LABEL_LIGHT] = {
      color: j.LightMode.LabelColor
    }
    rules[PAGING_BUTTON_LIGHT] = {
      color: j.LightMode.PagingButtonColor
    }
    rules[PAGING_BUTTON_DISABLED_LIGHT] = {
      color: j.LightMode.DisabledPagingButtonColor
    }
    rules[PREEDIT_LIGHT] = {
      color: j.LightMode.PreeditColor
    }
    rules[CURSOR_NO_TEXT_LIGHT] = {
      'background-color': j.LightMode.PreeditColor
    }
    rules[PANEL_LIGHT] = {
      'border-color': j.LightMode.BorderColor
    }
    rules[PANEL_LIGHT_DIVIDER_MIDDLE] = {
      'background-color': j.LightMode.DividerColor
    }
    rules[PANEL_LIGHT_DIVIDER_SIDE] = {
      'background-color': lightBackgroundColor
    }
    rules[HIGHLIGHT_MARK_LIGHT] = {
      [markKey]: j.LightMode.HighlightMarkColor
    }
    if (j.Highlight.HoverBehavior === 'Add') {
      rules[PANEL_LIGHT_OTHER_HOVER] = {
        'background-color': j.LightMode.HighlightColor
      }
      rules[PANEL_LIGHT_OTHER_PRESS] = {
        'background-color': j.LightMode.HighlightHoverColor
      }
    }
  }

  if (j.DarkMode.OverrideDefault === 'True') {
    if (j.DarkMode.SameWithLightMode === 'True' && j.LightMode.OverrideDefault === 'True') {
      const keys = [
        PANEL_LIGHT_HIGHLIGHT,
        PANEL_LIGHT_HIGHLIGHT_HOVER,
        PANEL_LIGHT_HIGHLIGHT_PRESS,
        TEXT_LIGHT_HIGHLIGHT,
        TEXT_LIGHT_PRESS,
        LABEL_LIGHT_HIGHLIGHT,
        HEADER_LIGHT_BACKGROUND,
        HOVERABLES_LIGHT_BACKGROUND,
        TEXT_LIGHT,
        LABEL_LIGHT,
        PAGING_BUTTON_LIGHT,
        PAGING_BUTTON_DISABLED_LIGHT,
        PREEDIT_LIGHT,
        CURSOR_NO_TEXT_LIGHT,
        PANEL_LIGHT,
        PANEL_LIGHT_DIVIDER_MIDDLE,
        PANEL_LIGHT_DIVIDER_SIDE,
        HIGHLIGHT_MARK_LIGHT
      ]
      if (j.Highlight.HoverBehavior === 'Add') {
        // This is the behavior of MSPY
        keys.push(PANEL_LIGHT_OTHER_HOVER, PANEL_LIGHT_OTHER_PRESS)
      }
      for (const key of keys) {
        rules[lightToDark(key)] = rules[key]
      }
    } else {
      const darkBackgroundColor = hasBackgroundImage ? 'inherit' : j.DarkMode.PanelColor

      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[PANEL_DARK_HIGHLIGHT_HOVER] = {
        'background-color': j.DarkMode.HighlightHoverColor
      }
      rules[PANEL_DARK_HIGHLIGHT_PRESS] = {
        'background-color': j.DarkMode.HighlightColor
      }
      rules[TEXT_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightTextColor
      }
      rules[TEXT_DARK_PRESS] = {
        color: j.DarkMode.HighlightTextPressColor
      }
      rules[LABEL_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightLabelColor
      }
      rules[HEADER_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor
      }
      rules[HOVERABLES_DARK_BACKGROUND] = {
        'background-color': darkBackgroundColor
      }
      rules[TEXT_DARK] = {
        color: j.DarkMode.TextColor
      }
      rules[LABEL_DARK] = {
        color: j.DarkMode.LabelColor
      }
      rules[PAGING_BUTTON_DARK] = {
        color: j.DarkMode.PagingButtonColor
      }
      rules[PAGING_BUTTON_DISABLED_DARK] = {
        color: j.DarkMode.DisabledPagingButtonColor
      }
      rules[PREEDIT_DARK] = {
        color: j.DarkMode.PreeditColor
      }
      rules[CURSOR_NO_TEXT_DARK] = {
        'background-color': j.DarkMode.PreeditColor
      }
      rules[PANEL_DARK] = {
        'border-color': j.DarkMode.BorderColor
      }
      rules[PANEL_DARK_DIVIDER_MIDDLE] = {
        'background-color': j.DarkMode.DividerColor
      }
      rules[PANEL_DARK_DIVIDER_SIDE] = {
        'background-color': darkBackgroundColor
      }
      rules[HIGHLIGHT_MARK_DARK] = {
        [markKey]: j.DarkMode.HighlightMarkColor
      }
      if (j.Highlight.HoverBehavior === 'Add') {
        rules[PANEL_DARK_OTHER_HOVER] = {
          'background-color': j.DarkMode.HighlightColor
        }
        rules[PANEL_DARK_OTHER_PRESS] = {
          'background-color': j.DarkMode.HighlightHoverColor
        }
      }
    }
  }

  if (j.Background.ImageUrl) {
    // Background image should not affect aux
    rules[HOVERABLES]['background-image'] = `url(${JSON.stringify(j.Background.ImageUrl)})`
    rules[HOVERABLES]['background-size'] = 'cover'
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
  rules[TEXT]['font-size'] = rules[CANDIDATE_INNER]['line-height'] = px(j.Font.TextFontSize)

  setFontFamily(rules[LABEL], j.Font.LabelFontFamily)
  rules[LABEL]['font-size'] = px(j.Font.LabelFontSize)

  setFontFamily(rules[PREEDIT], j.Font.PreeditFontFamily)
  rules[PREEDIT]['font-size'] = rules[PREEDIT]['line-height'] = px(j.Font.PreeditFontSize)
  // Cursor height should be the same with preedit
  rules[CURSOR_NO_TEXT].height = px(j.Font.PreeditFontSize)

  setBlink(j.Cursor.Style === 'Blink')

  rules[j.Highlight.HoverBehavior === 'Add' ? HIGHLIGHT_ORIGINAL_MARK : HIGHLIGHT_MARK].opacity = j.Highlight.MarkStyle === 'None' ? '0' : '1'
  setHoverBehavior(j.Highlight.HoverBehavior)

  rules[PANEL]['border-width'] = px(j.Size.BorderWidth)
  rules[PANEL]['border-radius'] = px(j.Size.BorderRadius)

  const halfMargin = px(Number(j.Size.Margin) / 2)
  rules[CANDIDATE_INNER].margin = px(j.Size.Margin)

  if (j.Size.HorizontalDividerWidth === '0') {
    rules[VERTICAL_CANDIDATE_INNER] = {
      'margin-top': halfMargin,
      'margin-bottom': halfMargin
    }
    rules[VERTICAL_FIRST_CANDIDATE_INNER] = {
      'margin-top': px(j.Size.Margin)
    }
    rules[VERTICAL_LAST_CANDIDATE_INNER] = {
      'margin-bottom': px(j.Size.Margin)
    }
  }
  // Unconditional since there is no vertical divider between candidates.
  rules[HORIZONTAL_CANDIDATE_INNER] = {
    'margin-left': halfMargin,
    'margin-right': halfMargin
  }
  rules[HORIZONTAL_FIRST_CANDIDATE_INNER] = {
    'margin-left': px(j.Size.Margin)
  }
  rules[HORIZONTAL_LAST_CANDIDATE_INNER] = {
    'margin-right': px(j.Size.Margin)
  }

  rules[PAGING_OUTER].margin = px(j.Size.Margin)
  rules[CANDIDATE_INNER]['border-radius'] = rules[PAGING_INNER]['border-radius'] = px(j.Size.HighlightRadius)
  rules[CANDIDATE_INNER]['padding-top'] = px(j.Size.TopPadding)
  rules[CANDIDATE_INNER]['padding-right'] = px(j.Size.RightPadding)
  rules[CANDIDATE_INNER]['padding-bottom'] = px(j.Size.BottomPadding)
  rules[CANDIDATE_INNER]['padding-left'] = px(j.Size.LeftPadding)
  rules[CANDIDATE_INNER].gap = px(j.Size.LabelTextGap)
  rules[PANEL_HORIZONTAL_DIVIDER] = {
    height: px(j.Size.HorizontalDividerWidth)
  }
  rules[PANEL_HORIZONTAL_DIVIDER_SIDE] = {
    width: px(j.Size.Margin)
  }
  rules[PANEL_VERTICAL_DIVIDER_SIDE] = {
    height: px(j.Size.Margin)
  }

  const basic = document.head.querySelector('#basic')
  if (basic) {
    basic.innerHTML = Object.entries(rules).map(([selector, block]) =>
      `${selector} {` + Object.entries(block).map(([key, value]) =>
        `${key}: ${value};`).join('\n') + '}').join('\n')
  }
}
