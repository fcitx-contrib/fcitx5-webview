import type {
  Locator,
  Page,
} from '@playwright/test'
import { dirname, join } from 'node:path'

export const transparent = 'rgba(0, 0, 0, 0)'
export const white = 'rgb(255, 255, 255)'

export async function init(page: Page) {
  const url = `file://${join(dirname(import.meta.url), '..', 'dist', 'index.html').substring('file:'.length)}`
  await page.goto(url)
  await page.evaluate(() => {
    window.fcitx.setTheme(2)
    window.cppCalls = []
    window.fcitx._resize = (epoch: number, dx: number, dy: number, anchorTop: number, anchorRight: number, anchorBottom: number, anchorLeft: number, panelTop: number, panelRight: number, panelBottom: number, panelLeft: number, topLeftRadius: number, topRightRadius: number, bottomRightRadius: number, bottomLeftRadius: number, borderWidth: number, fullWidth: number, fullHeight: number, dragging: boolean) => {
      window.cppCalls.push({
        resize: [epoch, dx, dy, anchorTop, anchorRight, anchorBottom, anchorLeft, panelTop, panelRight, panelBottom, panelLeft, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius, borderWidth, fullWidth, fullHeight, dragging],
      })
    }
    window.fcitx._select = (index: number) => {
      window.cppCalls.push({
        select: index,
      })
    }
    window.fcitx._action = (index: number, id: number) => {
      window.cppCalls.push({
        action: [index, id],
      })
    }
    window.fcitx._highlight = (index: number) => {
      window.cppCalls.push({
        highlight: index,
      })
    }
    window.fcitx._scroll = (start: number, length: number) => {
      window.cppCalls.push({
        scroll: [start, length],
      })
    }
    window.fcitx._log = () => {}
  })
}

export async function followHostTheme(page: Page, system: string, version: number) {
  await page.evaluate(({ system, version }) =>
    window.fcitx.setHost(system, version), { system, version })
  return setStyle(page, { Size: { OverrideDefault: 'False' } })
}

export function updateInputPanel(page: Page, preedit: string, auxUp: string, auxDown: string) {
  return page.evaluate(({ preedit, auxUp, auxDown }) =>
    window.fcitx.updateInputPanel(preedit, auxUp, auxDown), { preedit, auxUp, auxDown })
}

export function setCandidates(page: Page, cands: Partial<Candidate>[], highlighted: number, markText = '') {
  return page.evaluate(({ cands, highlighted, markText }) =>
    window.fcitx.setCandidates(cands.map(cand => ({ text: 'text', label: '1', comment: 'comment', actions: [], ...cand })), highlighted, markText, false, false, false, 0, false, false), { cands, highlighted, markText })
}

export async function scrollExpand(page: Page, texts: string[]) {
  const cands = texts.map(text => ({ text, label: '', comment: '', actions: [] }))
  await page.evaluate(({ cands }) =>
    window.fcitx.setCandidates(cands, 0, '', false, false, false, 1, false, false), { cands })
  return page.evaluate(({ cands }) =>
    window.fcitx.setCandidates(cands, -1, '', false, false, false, 2, true, false), { cands })
}

export function scroll(page: Page, texts: string[], scrollEnd: boolean) {
  const cands = texts.map(text => ({ text, label: '', comment: '', actions: [] }))
  return page.evaluate(({ cands, scrollEnd }) =>
    window.fcitx.setCandidates(cands, -1, '', false, false, false, 2, false, scrollEnd), { cands, scrollEnd })
}

export function setLayout(page: Page, layout: LAYOUT) {
  return page.evaluate(({ layout }) =>
    window.fcitx.setLayout(layout), { layout })
}

export function setWritingMode(page: Page, mode: WRITING_MODE) {
  return page.evaluate(({ mode }) =>
    window.fcitx.setWritingMode(mode), { mode })
}

const defaultStyle: STYLE_JSON = {
  Advanced: {
    UserCss: '',
  },
  Background: {
    Blur: 'True',
    KeepPanelColorWhenHasImage: 'False',
    ImageUrl: '',
    Shadow: 'True',
  },
  Basic: {
    DefaultTheme: 'System',
  },
  Caret: {
    Style: 'Blink',
  },
  DarkMode: {
    BorderColor: '#ffffff',
    CommentColor: '#ffffff',
    DisabledPagingButtonColor: '#7f7f7f',
    DividerColor: '#ffffff',
    HighlightColor: '#0000ff',
    HighlightCommentColor: '#ffffff',
    HighlightHoverColor: '#00007f',
    HighlightLabelColor: '#ffffff',
    HighlightMarkColor: '#ffffff',
    HighlightTextColor: '#ffffff',
    HighlightTextPressColor: '#7f7f7f',
    LabelColor: '#ffffff',
    OverrideDefault: 'False',
    PagingButtonColor: '#ffffff',
    PanelColor: '#000000',
    AuxColor: '#ffffff',
    PreeditColorPreCaret: '#ffffff',
    PreeditColorCaret: '#ffffff',
    PreeditColorPostCaret: '#ffffff',
    SameWithLightMode: 'False',
    TextColor: '#ffffff',
  },
  Font: {
    CommentFontFamily: {
      0: '',
    },
    CommentFontSize: '12',
    LabelFontFamily: {
      0: '',
    },
    LabelFontSize: '12',
    PreeditFontFamily: {
      0: '',
    },
    PreeditFontSize: '16',
    TextFontFamily: {
      0: '',
    },
    TextFontSize: '16',
  },
  Highlight: {
    HoverBehavior: 'None',
    MarkStyle: 'None',
  },
  LightMode: {
    BorderColor: '#000000',
    CommentColor: '#000000',
    DisabledPagingButtonColor: '#7f7f7f',
    DividerColor: '#000000',
    HighlightColor: '#0000ff',
    HighlightCommentColor: '#ffffff',
    HighlightHoverColor: '#00007f',
    HighlightLabelColor: '#ffffff',
    HighlightMarkColor: '#ffffff',
    HighlightTextColor: '#ffffff',
    HighlightTextPressColor: '#7f7f7f',
    LabelColor: '#000000',
    OverrideDefault: 'False',
    PagingButtonColor: '#000000',
    PanelColor: '#ffffff',
    AuxColor: '#000000',
    PreeditColorPreCaret: '#000000',
    PreeditColorCaret: '#000000',
    PreeditColorPostCaret: '#000000',
    TextColor: '#000000',
  },
  ScrollMode: {
    Animation: 'True',
    MaxRowCount: '6',
    MaxColumnCount: '6',
  },
  Size: {
    OverrideDefault: 'False',
    BorderRadius: '6',
    BorderWidth: '1',
    BottomPadding: '3',
    HighlightRadius: '0',
    HorizontalDividerWidth: '1',
    LabelTextGap: '6',
    LeftPadding: '7',
    Margin: '0',
    RightPadding: '7',
    TopPadding: '3',
    VerticalMinWidth: '200',
    ScrollCellWidth: '65',
  },
  Typography: {
    PagingButtonsStyle: 'Arrow',
  },
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
}

function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  const result: any = { ...base }
  for (const key in overrides) {
    if (
      typeof overrides[key] === 'object'
    ) {
      result[key] = deepMerge((base as any)[key], overrides[key]!)
    }
    else {
      result[key] = overrides[key]
    }
  }
  return result
}

export type PartialStyle = DeepPartial<STYLE_JSON>

export function setStyle(page: Page, style: PartialStyle) {
  return page.evaluate(({ style }) =>
    window.fcitx.setStyle(JSON.stringify(style)), { style: deepMerge(defaultStyle, style) })
}

export function theme(page: Page) {
  return page.locator('#fcitx-theme')
}

export function panel(page: Page) {
  return page.locator('.fcitx-panel')
}

export function hoverables(page: Page) {
  return page.locator('.fcitx-hoverables')
}

export function candidate(page: Page, index: number) {
  return panel(page).locator('.fcitx-candidate').nth(index)
}

export function mark(page: Page, index: number) {
  return candidate(page, index).locator('.fcitx-mark')
}

export async function getBox(locator: Locator) {
  return (await locator.boundingBox())!
}

export async function hover(page: Page, index: number) {
  // I have no idea why 3 steps are needed to trigger visual hover state.
  await page.hover(`.fcitx-candidate:nth-child(${index * 2 + 1})`)
  const cand = candidate(page, index)
  const box = await getBox(cand)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  return cand.hover()
}

export async function press(page: Page, index: number) {
  const cand = candidate(page, index)
  const box = await getBox(cand)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  return page.mouse.down()
}

export async function getTextBox(locator: Locator, index: number) {
  return locator.evaluate((el, index) => {
    const range = document.createRange()
    range.setStart(el.firstChild!, index)
    range.setEnd(el.firstChild!, index + 1)
    return range.getBoundingClientRect()
  }, index)
}

export function getCppCalls(page: Page) {
  return page.evaluate(() => window.cppCalls)
}
