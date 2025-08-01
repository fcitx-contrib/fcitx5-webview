import { setAnimation, setScrollParams } from './scroll'
import { hoverables } from './selector'
import {
  setBlink,
  setBlur,
  setHoverBehavior,
  setPagingButtonsStyle,
} from './ux'

const PANEL = '.fcitx-basic .fcitx-panel'
const PANEL_VERTICAL_CANDIDATE = `${PANEL}.fcitx-horizontal-tb .fcitx-vertical .fcitx-candidate`
const PANEL_HORIZONTAL_DIVIDER = `${PANEL} .fcitx-hoverables.fcitx-vertical .fcitx-divider`
const PANEL_HORIZONTAL_DIVIDER_SIDE = `${PANEL} .fcitx-hoverables.fcitx-vertical .fcitx-divider-side`
// left of prev paging button, same with MSPY
const PANEL_VERTICAL_DIVIDER_SIDE = `${PANEL} .fcitx-hoverables.fcitx-horizontal .fcitx-divider-paging .fcitx-divider-side`
const HOVERABLES = `${PANEL} .fcitx-hoverables`
const LABEL = `${PANEL} .fcitx-label`
const TEXT = `${PANEL} .fcitx-text`
const COMMENT = `${PANEL} .fcitx-comment`
const PREEDIT = `${PANEL} .fcitx-preedit`
const CARET_NO_TEXT = `${PANEL} .fcitx-caret.fcitx-no-text`
const CANDIDATE_INNER = `${PANEL} .fcitx-candidate-inner`
const FIRST_CANDIDATE_INNER = '.fcitx-candidate-first .fcitx-candidate-inner'
const LAST_CANDIDATE_INNER = '.fcitx-candidate-last .fcitx-candidate-inner'
const VERTICAL_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-vertical .fcitx-candidate-inner`
const VERTICAL_FIRST_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-vertical ${FIRST_CANDIDATE_INNER}`
const VERTICAL_LAST_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-vertical ${LAST_CANDIDATE_INNER}`
const HORIZONTAL_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-horizontal:not(.fcitx-horizontal-scroll) .fcitx-candidate-inner`
const HORIZONTAL_FIRST_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-horizontal ${FIRST_CANDIDATE_INNER}`
const HORIZONTAL_LAST_CANDIDATE_INNER = `${PANEL} .fcitx-hoverables.fcitx-horizontal ${LAST_CANDIDATE_INNER}`
const PAGING_OUTER = `${PANEL} :is(.fcitx-prev, .fcitx-next)`
const PAGING_INNER = `${PANEL} .fcitx-paging-inner`
const HIGHLIGHT_MARK = `${PANEL} .fcitx-highlighted .fcitx-mark`
const HIGHLIGHT_ORIGINAL_MARK = `${PANEL} .fcitx-highlighted-original .fcitx-mark`
const HORIZONTAL_SCROLL = `${PANEL} .fcitx-hoverables.fcitx-horizontal-scroll`
const HORIZONTAL_SCROLL_CANDIDATE = `${HORIZONTAL_SCROLL} .fcitx-candidate`
const HORIZONTAL_CORNER = `${PANEL}:has(.fcitx-horizontal .fcitx-paging:is(.fcitx-arrow, .fcitx-scroll))`

const PANEL_LIGHT = `.fcitx-light${PANEL}`
// Not sure why but considering Margin only for initial state (i.e., not hover or press) is good enough for eliminating ghost stripes.
const PANEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} :is(.fcitx-no-margin .fcitx-hoverable.fcitx-highlighted, .fcitx-margin .fcitx-hoverable.fcitx-highlighted .fcitx-hoverable-inner)`
const PANEL_LIGHT_HIGHLIGHT_HOVER = `${PANEL_LIGHT} .fcitx-mousemoved .fcitx-hoverable.fcitx-highlighted:hover .fcitx-hoverable-inner`
const PANEL_LIGHT_HIGHLIGHT_PRESS = `${PANEL_LIGHT} .fcitx-hoverable.fcitx-highlighted:active .fcitx-hoverable-inner`
const PANEL_LIGHT_OTHER_HOVER = `${PANEL_LIGHT} .fcitx-mousemoved .fcitx-hoverable:not(.fcitx-highlighted):hover .fcitx-hoverable-inner`
const PANEL_LIGHT_OTHER_PRESS = `${PANEL_LIGHT} .fcitx-hoverable:not(.fcitx-highlighted):active .fcitx-hoverable-inner`
const TEXT_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .fcitx-candidate.fcitx-highlighted .fcitx-text`
const TEXT_LIGHT_PRESS = `${PANEL_LIGHT} .fcitx-candidate:active .fcitx-candidate-inner .fcitx-text`
const LABEL_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .fcitx-candidate.fcitx-highlighted .fcitx-label`
const COMMENT_LIGHT_HIGHLIGHT = `${PANEL_LIGHT} .fcitx-candidate.fcitx-highlighted .fcitx-comment`
const TEXT_LIGHT = `${PANEL_LIGHT} .fcitx-text`
const LABEL_LIGHT = `${PANEL_LIGHT} .fcitx-label`
const COMMENT_LIGHT = `${PANEL_LIGHT} .fcitx-comment`
const PAGING_BUTTON_LIGHT = `${PANEL_LIGHT} .fcitx-paging .fcitx-hoverable-inner svg`
const PAGING_BUTTON_DISABLED_LIGHT = `${PANEL_LIGHT} .fcitx-paging svg`
const AUX_LIGHT = `${PANEL_LIGHT} :is(.fcitx-aux-up, .fcitx-aux-down)`
const CARET_LIGHT = `${PANEL_LIGHT} .fcitx-caret`
const PREEDIT_PRE_CARET_LIGHT = `${PANEL_LIGHT} .fcitx-pre-caret`
const PREEDIT_POST_CARET_LIGHT = `${PANEL_LIGHT} .fcitx-post-caret`
const HEADER_LIGHT_BACKGROUND = `${PANEL_LIGHT} :is(.fcitx-header, .fcitx-aux-down)`
const HOVERABLES_LIGHT_BACKGROUND = `${PANEL_LIGHT} .fcitx-hoverables :is(.fcitx-candidate, .fcitx-paging)`
const PANEL_LIGHT_DIVIDER_MIDDLE = `${PANEL_LIGHT} .fcitx-hoverables .fcitx-divider .fcitx-divider-middle`
const PANEL_LIGHT_DIVIDER_SIDE = `${PANEL_LIGHT} .fcitx-hoverables .fcitx-divider .fcitx-divider-side`
const PANEL_LIGHT_SCROLL_DIVIDER = `${PANEL_LIGHT} .fcitx-hoverables.fcitx-horizontal-scroll .fcitx-divider-middle`
const PANEL_LIGHT_SCROLL_TRACK = `${PANEL_LIGHT} .fcitx-hoverables.fcitx-horizontal-scroll::-webkit-scrollbar-track`
const CARET_NO_TEXT_LIGHT = `${PANEL_LIGHT} .fcitx-caret.fcitx-no-text`
const HIGHLIGHT_MARK_LIGHT = `${PANEL_LIGHT} .fcitx-highlighted .fcitx-mark`

const PANEL_DARK = `.fcitx-dark${PANEL}`

function lightToDark(light: string) {
  return light.replace(PANEL_LIGHT, PANEL_DARK)
}

// For eliminating ghost stripes. See macos.scss for details.
function setMargin(hasMargin: boolean) {
  if (hasMargin) {
    hoverables.classList.add('fcitx-margin')
    hoverables.classList.remove('fcitx-no-margin')
  }
  else {
    hoverables.classList.remove('fcitx-margin')
    hoverables.classList.add('fcitx-no-margin')
  }
}

const PANEL_DARK_HIGHLIGHT = lightToDark(PANEL_LIGHT_HIGHLIGHT)
const PANEL_DARK_HIGHLIGHT_HOVER = lightToDark(PANEL_LIGHT_HIGHLIGHT_HOVER)
const PANEL_DARK_HIGHLIGHT_PRESS = lightToDark(PANEL_LIGHT_HIGHLIGHT_PRESS)
const PANEL_DARK_OTHER_HOVER = lightToDark(PANEL_LIGHT_OTHER_HOVER)
const PANEL_DARK_OTHER_PRESS = lightToDark(PANEL_LIGHT_OTHER_PRESS)
const TEXT_DARK_HIGHLIGHT = lightToDark(TEXT_LIGHT_HIGHLIGHT)
const TEXT_DARK_PRESS = lightToDark(TEXT_LIGHT_PRESS)
const LABEL_DARK_HIGHLIGHT = lightToDark(LABEL_LIGHT_HIGHLIGHT)
const COMMENT_DARK_HIGHLIGHT = lightToDark(COMMENT_LIGHT_HIGHLIGHT)
const TEXT_DARK = lightToDark(TEXT_LIGHT)
const LABEL_DARK = lightToDark(LABEL_LIGHT)
const COMMENT_DARK = lightToDark(COMMENT_LIGHT)
const PAGING_BUTTON_DARK = lightToDark(PAGING_BUTTON_LIGHT)
const PAGING_BUTTON_DISABLED_DARK = lightToDark(PAGING_BUTTON_DISABLED_LIGHT)
const AUX_DARK = lightToDark(AUX_LIGHT)
const CARET_DARK = lightToDark(CARET_LIGHT)
const PREEDIT_PRE_CARET_DARK = lightToDark(PREEDIT_PRE_CARET_LIGHT)
const PREEDIT_POST_CARET_DARK = lightToDark(PREEDIT_POST_CARET_LIGHT)
const HEADER_DARK_BACKGROUND = lightToDark(HEADER_LIGHT_BACKGROUND)
const HOVERABLES_DARK_BACKGROUND = lightToDark(HOVERABLES_LIGHT_BACKGROUND)
const PANEL_DARK_DIVIDER_MIDDLE = lightToDark(PANEL_LIGHT_DIVIDER_MIDDLE)
const PANEL_DARK_DIVIDER_SIDE = lightToDark(PANEL_LIGHT_DIVIDER_SIDE)
const PANEL_DARK_SCROLL_DIVIDER = lightToDark(PANEL_LIGHT_SCROLL_DIVIDER)
const PANEL_DARK_SCROLL_TRACK = lightToDark(PANEL_LIGHT_SCROLL_TRACK)
const CARET_NO_TEXT_DARK = lightToDark(CARET_NO_TEXT_LIGHT)
const HIGHLIGHT_MARK_DARK = lightToDark(HIGHLIGHT_MARK_LIGHT)

function px(n: string | number) {
  return `${n}px`
}

function setFontFamily(o: { [key: string]: string }, f: FONT_FAMILY) {
  const fontFamily = Object.values(f).filter(s => s.trim().length > 0).map(s => JSON.stringify(s.trim()))
  if (fontFamily.length > 0) {
    o['font-family'] = fontFamily.join(', ')
  }
}

function noCache(url: string): string {
  return `${url}?r=${Math.random()}`
}

export function setStyle(style: string) {
  const j = JSON.parse(style) as STYLE_JSON
  const rules: { [key: string]: { [key: string]: string } } = {}
  const hasBackgroundImage = j.Background.ImageUrl.trim() !== ''
  const markKey = j.Highlight.MarkStyle === 'Text' ? 'color' : 'background-color'
  rules[PANEL] = {}
  rules[HOVERABLES] = {}
  rules[TEXT] = {}
  rules[LABEL] = {}
  rules[COMMENT] = {}
  rules[PREEDIT] = {}
  rules[CARET_NO_TEXT] = {}
  rules[HIGHLIGHT_MARK] = {}
  rules[HIGHLIGHT_ORIGINAL_MARK] = {}
  rules[CANDIDATE_INNER] = {}
  rules[PAGING_OUTER] = {}
  rules[PAGING_INNER] = {}

  if (j.LightMode.OverrideDefault === 'True') {
    const lightBackgroundColor = hasBackgroundImage ? 'inherit' : j.LightMode.PanelColor

    rules[PANEL_LIGHT_HIGHLIGHT] = {
      'background-color': j.LightMode.HighlightColor,
    }
    rules[PANEL_LIGHT_HIGHLIGHT_HOVER] = {
      'background-color': j.LightMode.HighlightHoverColor,
    }
    rules[PANEL_LIGHT_HIGHLIGHT_PRESS] = {
      'background-color': j.LightMode.HighlightColor,
    }
    rules[TEXT_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightTextColor,
    }
    rules[TEXT_LIGHT_PRESS] = {
      color: j.LightMode.HighlightTextPressColor,
    }
    rules[LABEL_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightLabelColor,
    }
    rules[COMMENT_LIGHT_HIGHLIGHT] = {
      color: j.LightMode.HighlightCommentColor,
    }
    rules[HEADER_LIGHT_BACKGROUND] = {
      'background-color': j.LightMode.PanelColor,
    }
    rules[HOVERABLES_LIGHT_BACKGROUND] = {
      // With background image, discard panel color for unselected candidates
      'background-color': lightBackgroundColor,
    }
    rules[TEXT_LIGHT] = {
      color: j.LightMode.TextColor,
    }
    rules[LABEL_LIGHT] = {
      color: j.LightMode.LabelColor,
    }
    rules[COMMENT_LIGHT] = {
      color: j.LightMode.CommentColor,
    }
    rules[PAGING_BUTTON_LIGHT] = {
      color: j.LightMode.PagingButtonColor,
    }
    rules[PAGING_BUTTON_DISABLED_LIGHT] = {
      color: j.LightMode.DisabledPagingButtonColor,
    }
    rules[AUX_LIGHT] = {
      color: j.LightMode.AuxColor,
    }
    rules[CARET_LIGHT] = {
      color: j.LightMode.PreeditColorCaret,
    }
    rules[CARET_NO_TEXT_LIGHT] = {
      'background-color': j.LightMode.PreeditColorCaret,
    }
    rules[PREEDIT_PRE_CARET_LIGHT] = {
      color: j.LightMode.PreeditColorPreCaret,
    }
    rules[PREEDIT_POST_CARET_LIGHT] = {
      color: j.LightMode.PreeditColorPostCaret,
    }
    rules[PANEL_LIGHT] = {
      'border-color': j.LightMode.BorderColor,
    }
    rules[PANEL_LIGHT_DIVIDER_MIDDLE] = {
      'background-color': j.LightMode.DividerColor,
    }
    rules[PANEL_LIGHT_DIVIDER_SIDE] = {
      'background-color': lightBackgroundColor,
    }
    rules[PANEL_LIGHT_SCROLL_DIVIDER] = rules[PANEL_LIGHT_SCROLL_TRACK] = {
      'background-color': lightBackgroundColor,
    }
    rules[HIGHLIGHT_MARK_LIGHT] = {
      [markKey]: j.LightMode.HighlightMarkColor,
    }
    if (j.Highlight.HoverBehavior === 'Add') {
      rules[PANEL_LIGHT_OTHER_HOVER] = {
        'background-color': j.LightMode.HighlightColor,
      }
      rules[PANEL_LIGHT_OTHER_PRESS] = {
        'background-color': j.LightMode.HighlightHoverColor,
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
        COMMENT_LIGHT_HIGHLIGHT,
        HEADER_LIGHT_BACKGROUND,
        HOVERABLES_LIGHT_BACKGROUND,
        TEXT_LIGHT,
        LABEL_LIGHT,
        COMMENT_LIGHT,
        PAGING_BUTTON_LIGHT,
        PAGING_BUTTON_DISABLED_LIGHT,
        AUX_LIGHT,
        CARET_LIGHT,
        PREEDIT_PRE_CARET_LIGHT,
        PREEDIT_POST_CARET_LIGHT,
        CARET_NO_TEXT_LIGHT,
        PANEL_LIGHT,
        PANEL_LIGHT_DIVIDER_MIDDLE,
        PANEL_LIGHT_DIVIDER_SIDE,
        PANEL_LIGHT_SCROLL_DIVIDER,
        PANEL_LIGHT_SCROLL_TRACK,
        HIGHLIGHT_MARK_LIGHT,
      ]
      if (j.Highlight.HoverBehavior === 'Add') {
        // This is the behavior of MSPY
        keys.push(PANEL_LIGHT_OTHER_HOVER, PANEL_LIGHT_OTHER_PRESS)
      }
      for (const key of keys) {
        rules[lightToDark(key)] = rules[key]
      }
    }
    else {
      const darkBackgroundColor = hasBackgroundImage ? 'inherit' : j.DarkMode.PanelColor

      rules[PANEL_DARK_HIGHLIGHT] = {
        'background-color': j.DarkMode.HighlightColor,
      }
      rules[PANEL_DARK_HIGHLIGHT_HOVER] = {
        'background-color': j.DarkMode.HighlightHoverColor,
      }
      rules[PANEL_DARK_HIGHLIGHT_PRESS] = {
        'background-color': j.DarkMode.HighlightColor,
      }
      rules[TEXT_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightTextColor,
      }
      rules[TEXT_DARK_PRESS] = {
        color: j.DarkMode.HighlightTextPressColor,
      }
      rules[LABEL_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightLabelColor,
      }
      rules[COMMENT_DARK_HIGHLIGHT] = {
        color: j.DarkMode.HighlightCommentColor,
      }
      rules[HEADER_DARK_BACKGROUND] = {
        'background-color': j.DarkMode.PanelColor,
      }
      rules[HOVERABLES_DARK_BACKGROUND] = {
        'background-color': darkBackgroundColor,
      }
      rules[TEXT_DARK] = {
        color: j.DarkMode.TextColor,
      }
      rules[LABEL_DARK] = {
        color: j.DarkMode.LabelColor,
      }
      rules[COMMENT_DARK] = {
        color: j.DarkMode.CommentColor,
      }
      rules[PAGING_BUTTON_DARK] = {
        color: j.DarkMode.PagingButtonColor,
      }
      rules[PAGING_BUTTON_DISABLED_DARK] = {
        color: j.DarkMode.DisabledPagingButtonColor,
      }
      rules[AUX_DARK] = {
        color: j.DarkMode.AuxColor,
      }
      rules[CARET_DARK] = {
        color: j.DarkMode.PreeditColorCaret,
      }
      rules[CARET_NO_TEXT_DARK] = {
        'background-color': j.DarkMode.PreeditColorCaret,
      }
      rules[PREEDIT_PRE_CARET_DARK] = {
        color: j.DarkMode.PreeditColorPreCaret,
      }
      rules[PREEDIT_POST_CARET_DARK] = {
        color: j.DarkMode.PreeditColorPostCaret,
      }
      rules[PANEL_DARK] = {
        'border-color': j.DarkMode.BorderColor,
      }
      rules[PANEL_DARK_DIVIDER_MIDDLE] = {
        'background-color': j.DarkMode.DividerColor,
      }
      rules[PANEL_DARK_DIVIDER_SIDE] = {
        'background-color': darkBackgroundColor,
      }
      rules[PANEL_DARK_SCROLL_DIVIDER] = rules[PANEL_DARK_SCROLL_TRACK] = {
        'background-color': darkBackgroundColor,
      }
      rules[HIGHLIGHT_MARK_DARK] = {
        [markKey]: j.DarkMode.HighlightMarkColor,
      }
      if (j.Highlight.HoverBehavior === 'Add') {
        rules[PANEL_DARK_OTHER_HOVER] = {
          'background-color': j.DarkMode.HighlightColor,
        }
        rules[PANEL_DARK_OTHER_PRESS] = {
          'background-color': j.DarkMode.HighlightHoverColor,
        }
      }
    }
  }

  setPagingButtonsStyle(j.Typography.PagingButtonsStyle)

  setMargin(j.Size.Margin !== '0')

  const maxRow = Number(j.ScrollMode.MaxRowCount)
  const maxColumn = Number(j.ScrollMode.MaxColumnCount)
  const cellWidth = Number(j.Size.ScrollCellWidth)
  setScrollParams(maxRow, maxColumn, cellWidth)
  const animation = j.ScrollMode.Animation === 'True'
  setAnimation(animation)
  const candidateHeight = Math.max(24 /* min-block-size of .fcitx-candidate-inner */, Number(j.Font.TextFontSize)) + Number(j.Size.TopPadding) + Number(j.Size.BottomPadding) + 2 * Number(j.Size.Margin)
  rules[HORIZONTAL_SCROLL] = {
    'max-block-size': px(maxRow * candidateHeight),
    'inline-size': px(cellWidth * maxColumn + 10 /* 2px redundance + 8px scrollbar making default 400px */),
    'transition': animation ? 'max-block-size 300ms' : 'none',
  }
  rules[HORIZONTAL_SCROLL_CANDIDATE] = {
    'min-inline-size': px(cellWidth),
  }
  rules[HORIZONTAL_CORNER] = {
    'border-start-end-radius': px(candidateHeight / 2),
    'border-end-end-radius': px(candidateHeight / 2),
  }

  if (j.Background.ImageUrl) {
    let url = j.Background.ImageUrl
    if (url.startsWith('fcitx://')) {
      url = noCache(url)
    }
    // Background image should not affect aux
    rules[HOVERABLES]['background-image'] = `url(${JSON.stringify(url)})`
    rules[HOVERABLES]['background-size'] = 'cover'
  }

  if (window.fcitx.distribution === 'fcitx5-js') {
    if (j.Background.Blur === 'True') {
      setBlur(true)
      const blur = `blur(${px(j.Background.BlurRadius!)})`
      rules['.fcitx-blur'] = { '-webkit-backdrop-filter': blur, 'backdrop-filter': blur }
    }
    else {
      setBlur(false)
    }
  }

  if (j.Background.Shadow === 'False') {
    rules[PANEL]['box-shadow'] = 'none'
  }

  setFontFamily(rules[TEXT], j.Font.TextFontFamily)
  rules[TEXT]['font-size'] = rules[CANDIDATE_INNER]['line-height'] = px(j.Font.TextFontSize)

  setFontFamily(rules[LABEL], j.Font.LabelFontFamily)
  rules[LABEL]['font-size'] = px(j.Font.LabelFontSize)

  setFontFamily(rules[COMMENT], j.Font.CommentFontFamily)
  rules[COMMENT]['font-size'] = px(j.Font.CommentFontSize)

  setFontFamily(rules[PREEDIT], j.Font.PreeditFontFamily)
  rules[PREEDIT]['font-size'] = rules[PREEDIT]['line-height'] = px(j.Font.PreeditFontSize)
  // Caret height should be the same with preedit
  rules[CARET_NO_TEXT]['block-size'] = px(j.Font.PreeditFontSize)

  setBlink(j.Caret.Style === 'Blink')

  rules[j.Highlight.HoverBehavior === 'Add' ? HIGHLIGHT_ORIGINAL_MARK : HIGHLIGHT_MARK].opacity = j.Highlight.MarkStyle === 'None' ? '0' : '1'
  setHoverBehavior(j.Highlight.HoverBehavior)

  rules[PANEL]['border-width'] = px(j.Size.BorderWidth)
  rules[PANEL]['border-radius'] = px(j.Size.BorderRadius)

  const halfMargin = px(Number(j.Size.Margin) / 2)
  rules[CANDIDATE_INNER].margin = px(j.Size.Margin)

  if (j.Size.HorizontalDividerWidth === '0') {
    rules[VERTICAL_CANDIDATE_INNER] = {
      'margin-block-start': halfMargin,
      'margin-block-end': halfMargin,
    }
    rules[VERTICAL_FIRST_CANDIDATE_INNER] = {
      'margin-block-start': px(j.Size.Margin),
    }
    rules[VERTICAL_LAST_CANDIDATE_INNER] = {
      'margin-block-end': px(j.Size.Margin),
    }
  }
  // Unconditional since there is no vertical divider between candidates.
  rules[HORIZONTAL_CANDIDATE_INNER] = {
    'margin-inline-start': halfMargin,
    'margin-inline-end': halfMargin,
  }
  rules[HORIZONTAL_FIRST_CANDIDATE_INNER] = {
    'margin-inline-start': px(j.Size.Margin),
  }
  rules[HORIZONTAL_LAST_CANDIDATE_INNER] = {
    'margin-inline-end': px(j.Size.Margin),
  }

  rules[PAGING_OUTER].margin = px(j.Size.Margin)
  rules[CANDIDATE_INNER]['border-radius'] = rules[PAGING_INNER]['border-radius'] = px(j.Size.HighlightRadius)
  rules[CANDIDATE_INNER]['padding-block-start'] = px(j.Size.TopPadding)
  rules[CANDIDATE_INNER]['padding-inline-end'] = px(j.Size.RightPadding)
  rules[CANDIDATE_INNER]['padding-block-end'] = px(j.Size.BottomPadding)
  rules[CANDIDATE_INNER]['padding-inline-start'] = px(j.Size.LeftPadding)
  rules[CANDIDATE_INNER].gap = px(j.Size.LabelTextGap)
  rules[PANEL_VERTICAL_CANDIDATE] = {
    'min-inline-size': px(j.Size.VerticalMinWidth),
  }
  rules[PANEL_HORIZONTAL_DIVIDER] = {
    'block-size': px(j.Size.HorizontalDividerWidth),
  }
  rules[PANEL_HORIZONTAL_DIVIDER_SIDE] = {
    'inline-size': px(j.Size.Margin),
  }
  rules[PANEL_VERTICAL_DIVIDER_SIDE] = {
    'block-size': px(j.Size.Margin),
  }

  const basic = document.head.querySelector('#fcitx-basic')
  if (basic) {
    basic.innerHTML = Object.entries(rules).map(([selector, block]) =>
      `${selector} {${Object.entries(block).map(([key, value]) =>
        `${key}: ${value};`).join('\n')}}`).join('\n')
  }

  document.head.querySelector('#fcitx-user')?.setAttribute('href', noCache(j.Advanced.UserCss))
}
