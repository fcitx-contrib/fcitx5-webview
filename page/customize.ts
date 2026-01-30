import { distribution } from './distribution'
import { fixGhostStripe } from './ghost-stripe'
import { setAnimation, setScrollParams } from './scroll'
import { theme } from './selector'
import {
  setBlink,
  setBlur,
  setHoverBehavior,
  setPagingButtonsStyle,
} from './ux'

function px(n: string | number) {
  return `${n}px`
}

const genericFontFamilies = [
  'cursive',
  'fangsong',
  'fantasy',
  'kai',
  'khmer-mul',
  'math',
  'monospace',
  'nastaliq',
  'sans-serif',
  'serif',
  'system-ui',
  'ui-monospace',
  'ui-rounded',
  'ui-sans-serif',
  'ui-serif',
]

function setFontFamily(name: string, f: FONT_FAMILY) {
  const fontFamily = Object.values(f).flatMap((s) => {
    s = s.trim()
    if (!s) {
      return []
    }
    if (genericFontFamilies.includes(s)) {
      return s
    }
    return JSON.stringify(s)
  })
  theme.style.setProperty(name, fontFamily.join(', '))
}

function noCache(url: string): string {
  return `${url}?r=${Math.random()}`
}

const allSystemClasses = ['macos']
const allVersionClasses = ['macos-26', 'macos-15']

let candidateHeight = 28

function setDefaultTheme(defaultTheme: DEFAULT_THEME) {
  let systemClass = ''
  let versionClass = ''
  switch (defaultTheme) {
    case 'macOS 26':
      systemClass = 'macos'
      versionClass = 'macos-26'
      candidateHeight = 28
      break
    case 'macOS 15':
      systemClass = 'macos'
      versionClass = 'macos-15'
      candidateHeight = 30
      break
  }
  for (const c of allSystemClasses) {
    const klass = `fcitx-${c}`
    if (c === systemClass) {
      theme.classList.add(klass)
    }
    else {
      theme.classList.remove(klass)
    }
  }
  for (const c of allVersionClasses) {
    const klass = `fcitx-${c}`
    if (c === versionClass) {
      theme.classList.add(klass)
    }
    else {
      theme.classList.remove(klass)
    }
  }
}

const ACCENT_COLOR = 'var(--accent-color)'

export function setStyle(style: string) {
  const j = JSON.parse(style) as STYLE_JSON

  let backgroundImage = j.Background.ImageUrl.trim()
  if (backgroundImage.startsWith('fcitx://')) {
    backgroundImage = noCache(backgroundImage)
  }

  function setColor(name: string, property: keyof STYLE_JSON['LightMode'] | '', fallback = '') {
    theme.style.setProperty(`--light-${name}`, j.LightMode.OverrideDefault === 'True' && property ? j.LightMode[property] : fallback)
    theme.style.setProperty(`--dark-${name}`, j.DarkMode.OverrideDefault === 'True' && property
      ? (j.DarkMode.SameWithLightMode === 'True' && j.LightMode.OverrideDefault === 'True' ? j.LightMode[property] : j.DarkMode[property])
      : fallback.replace('--light-', '--dark-'))
  }

  function setSize(name: string, value: number | string) {
    theme.style.setProperty(`--${name}`, j.Size.OverrideDefault === 'True' ? px(value) : '')
  }

  if (j.Basic.DefaultTheme === 'System') {
    if (window.fcitx.host.system === 'macOS' && window.fcitx.host.version <= 15) {
      setDefaultTheme('macOS 15')
    }
    else {
      setDefaultTheme('macOS 26')
    }
  }
  else {
    setDefaultTheme(j.Basic.DefaultTheme)
  }

  // Color
  setColor('highlight-color', 'HighlightColor', ACCENT_COLOR)
  setColor('highlight-hover-color', 'HighlightHoverColor')
  if (j.Highlight.HoverBehavior === 'Add') {
    // This is the behavior of Windows 11 MSPY.
    setColor('hover-color', 'HighlightColor', ACCENT_COLOR)
    setColor('press-color', 'HighlightHoverColor', ACCENT_COLOR)
    setColor('text-hover-color', '', 'var(--light-highlight-text-color, white)')
    setColor('text-press-color', '', 'var(--light-highlight-text-press-color, white)')
    setColor('label-hover-color', 'HighlightLabelColor', 'white')
    setColor('comment-hover-color', 'HighlightCommentColor', 'white')
  }
  else {
    setColor('hover-color', '')
    setColor('press-color', '')
    setColor('text-hover-color', '')
    setColor('text-press-color', '')
    setColor('label-hover-color', 'LabelColor')
    setColor('comment-hover-color', 'CommentColor')
  }
  setColor('highlight-text-color', 'HighlightTextColor')
  setColor('highlight-text-press-color', 'HighlightTextPressColor')
  setColor('highlight-label-color', 'HighlightLabelColor')
  setColor('highlight-comment-color', 'HighlightCommentColor')
  if (j.Highlight.MarkStyle === 'Text') {
    setColor('highlight-mark-text-color', 'HighlightMarkColor', 'white')
    setColor('highlight-mark-color', '', 'transparent')
  }
  else {
    setColor('highlight-mark-text-color', '')
    setColor('highlight-mark-color', 'HighlightMarkColor', 'white')
  }
  if (backgroundImage && j.Background.KeepPanelColorWhenHasImage === 'False') {
    setColor('panel-color-no-image', '', 'transparent')
  }
  else {
    setColor('panel-color-no-image', 'PanelColor')
  }
  setColor('panel-color', 'PanelColor')
  setColor('text-color', 'TextColor')
  setColor('label-color', 'LabelColor')
  setColor('comment-color', 'CommentColor')
  setColor('paging-button-color', 'PagingButtonColor')
  setColor('disabled-paging-button-color', 'DisabledPagingButtonColor')
  setColor('aux-color', 'AuxColor')
  setColor('preedit-color-pre-caret', 'PreeditColorPreCaret')
  setColor('preedit-color-caret', 'PreeditColorCaret')
  setColor('preedit-color-post-caret', 'PreeditColorPostCaret')
  setColor('panel-border-color', 'BorderColor')
  setColor('divider-color', 'DividerColor')

  // Size
  let cellWidth = 65
  if (j.Size.OverrideDefault === 'True') {
    cellWidth = Number(j.Size.ScrollCellWidth)
    candidateHeight = Math.max(24, Number(j.Font.TextFontSize)) + Number(j.Size.TopPadding) + Number(j.Size.BottomPadding) + 2 * Number(j.Size.Margin)
  }
  setSize('border-width', j.Size.BorderWidth)
  setSize('border-radius', j.Size.BorderRadius)
  setSize('margin', j.Size.Margin)
  setSize('middle-margin', j.Size.HorizontalDividerWidth === '0' ? Number(j.Size.Margin) / 2 : j.Size.Margin)
  setSize('highlight-radius', j.Size.HighlightRadius)
  setSize('top-padding', j.Size.TopPadding)
  setSize('right-padding', j.Size.RightPadding)
  setSize('bottom-padding', j.Size.BottomPadding)
  setSize('left-padding', j.Size.LeftPadding)
  setSize('label-text-gap', j.Size.LabelTextGap)
  setSize('vertical-min-width', j.Size.VerticalMinWidth)
  setSize('cell-width', cellWidth)
  setSize('horizontal-divider-width', j.Size.HorizontalDividerWidth)

  // Typography
  theme.style.setProperty('--vertical-comment-flex', j.Typography.VerticalCommentsAlignRight === 'True' ? '1' : '')
  setPagingButtonsStyle(j.Typography.PagingButtonsStyle)

  // Scroll mode
  const maxRow = Number(j.ScrollMode.MaxRowCount)
  const maxColumn = Number(j.ScrollMode.MaxColumnCount)
  theme.style.setProperty('--max-row', j.ScrollMode.MaxRowCount)
  theme.style.setProperty('--max-column', j.ScrollMode.MaxColumnCount)
  setScrollParams(maxRow, maxColumn, cellWidth, candidateHeight)
  theme.style.setProperty('--scrollbar-redundancy-width', j.ScrollMode.ShowScrollBar === 'False' ? '0px' : '2px')
  theme.style.setProperty('--scrollbar-width', j.ScrollMode.ShowScrollBar === 'False' ? '0px' : '8px')
  const animation = j.ScrollMode.Animation === 'True'
  theme.style.setProperty('--scroll-animation', animation ? '' : 'none')
  setAnimation(animation)

  // Background
  theme.style.setProperty('--background-image', backgroundImage ? `url(${JSON.stringify(backgroundImage)})` : '')

  if (distribution === 'fcitx5-js') {
    if (j.Background.Blur === 'True') {
      setBlur(true)
    }
    else {
      setBlur(false)
    }
    const blur = `blur(${px(j.Background.BlurRadius!)})`
    theme.style.setProperty('--backdrop-filter', blur)
  }

  theme.style.setProperty('--panel-shadow', j.Background.Shadow === 'True' ? '' : 'none')

  // Font
  setFontFamily('--text-font-family', j.Font.TextFontFamily)
  theme.style.setProperty('--text-font-size', px(j.Font.TextFontSize))
  theme.style.setProperty('--text-font-weight', j.Font.TextFontWeight)

  setFontFamily('--label-font-family', j.Font.LabelFontFamily)
  theme.style.setProperty('--label-font-size', px(j.Font.LabelFontSize))
  theme.style.setProperty('--label-font-weight', j.Font.LabelFontWeight)

  setFontFamily('--comment-font-family', j.Font.CommentFontFamily)
  theme.style.setProperty('--comment-font-size', px(j.Font.CommentFontSize))
  theme.style.setProperty('--comment-font-weight', j.Font.CommentFontWeight)

  setFontFamily('--preedit-font-family', j.Font.PreeditFontFamily)
  theme.style.setProperty('--preedit-font-size', px(j.Font.PreeditFontSize))
  theme.style.setProperty('--preedit-font-weight', j.Font.PreeditFontWeight)

  // Caret
  setBlink(j.Caret.Style === 'Blink')

  // Highlight
  setHoverBehavior(j.Highlight.HoverBehavior)
  theme.style.setProperty('--mark-opacity', j.Highlight.MarkStyle === 'None' ? '0' : '1')

  document.head.querySelector('#fcitx-user')?.setAttribute('href', noCache(j.Advanced.UserCss))

  fixGhostStripe(j)
}
