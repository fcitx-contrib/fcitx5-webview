import type { Page } from '@playwright/test'
import type { PartialStyle } from '../util'
import { expect, test } from '@playwright/test'
import { VERTICAL } from '../../page/constant'
import { candidate, hover, init, mark, press, setCandidates, setLayout, setStyle, transparent, white } from '../util'

const highlight = 'rgb(255, 0, 0)'
const highlightHover = 'rgb(0, 255, 0)'
const highlightText = 'rgb(0, 0, 255)'
const highlightTextPress = 'rgb(255, 255, 0)'
const highlightLabel = 'rgb(255, 0, 255)'
const highlightComment = 'rgb(0, 255, 255)'
const highlightMark = 'rgb(127, 0, 0)'
const text = 'rgb(0, 127, 0)'
const label = 'rgb(0, 0, 127)'
const comment = 'rgb(127, 127, 0)'
const style: PartialStyle = {
  DarkMode: {
    OverrideDefault: 'True',
    SameWithLightMode: 'False',
    HighlightColor: highlight,
    HighlightHoverColor: highlightHover,
    HighlightTextColor: highlightText,
    HighlightTextPressColor: highlightTextPress,
    HighlightLabelColor: highlightLabel,
    HighlightCommentColor: highlightComment,
    HighlightMarkColor: highlightMark,
    TextColor: text,
    LabelColor: label,
    CommentColor: comment,
  },
}

function expectHighlight(page: Page, index: number, highlight: boolean | string) {
  return expect(candidate(page, index).locator('.fcitx-candidate-inner')).toHaveCSS('background-color', typeof highlight === 'string' ? highlight : highlight ? 'rgb(0, 122, 255)' : transparent)
}

async function expectText(page: Page, index: number, text: string, label: string, comment: string) {
  await expect(candidate(page, index).locator('.fcitx-text')).toHaveCSS('color', text)
  await expect(candidate(page, index).locator('.fcitx-label')).toHaveCSS('color', label)
  await expect(candidate(page, index).locator('.fcitx-comment')).toHaveCSS('color', comment)
}

test('Default theme, no mark, no hover', async ({ page }) => {
  await init(page)
  await setCandidates(page, [{}, {}, {}], 0)

  for (const action of [
    async () => {},
    () => hover(page, 2),
    () => press(page, 2),
    () => page.mouse.up().then(() => hover(page, 0)),
    () => press(page, 0),
  ]) {
    await action()

    await expect(mark(page, 0)).toHaveCSS('background-color', transparent)
    await expect(mark(page, 1)).toHaveCount(0)
    await expect(mark(page, 2)).toHaveCount(0)

    await expectHighlight(page, 0, true)
    await expectHighlight(page, 1, false)
    await expectHighlight(page, 2, false)
  }
})

test('Default theme, no mark, hover move', async ({ page }) => {
  await init(page)
  await setStyle(page, { Highlight: { HoverBehavior: 'Move' } })
  await setCandidates(page, [{}, {}, {}], 0)

  for (const action of [() => hover(page, 2), () => press(page, 2)]) {
    await action()

    await expect(mark(page, 0)).toHaveCount(0)
    await expect(mark(page, 1)).toHaveCount(0)
    await expect(mark(page, 2)).toHaveCSS('opacity', '0')

    await expectHighlight(page, 0, false)
    await expectHighlight(page, 1, false)
    await expectHighlight(page, 2, true)
  }
})

test('Default theme, no mark, hover add', async ({ page }) => {
  await init(page)
  await setStyle(page, { Highlight: { HoverBehavior: 'Add' } })
  await setCandidates(page, [{}, {}, {}], 0)

  for (const action of [() => hover(page, 2), () => press(page, 2)]) {
    await action()

    await expect(mark(page, 0)).toHaveCSS('opacity', '0')
    await expect(mark(page, 1)).toHaveCount(0)
    await expect(mark(page, 2)).toHaveCount(0)

    await expectHighlight(page, 0, true)
    await expectHighlight(page, 1, false)
    await expectHighlight(page, 2, true)
  }
})

test('User theme, no mark, no hover', async ({ page }) => {
  await init(page)
  await setStyle(page, style)
  await setCandidates(page, [{}, {}, {}], 0)

  for (const action of [async () => {}, () => hover(page, 2), () => press(page, 2)]) {
    await action()

    await expect(mark(page, 0)).toHaveCSS('opacity', '0')
    await expect(mark(page, 1)).toHaveCount(0)
    await expect(mark(page, 2)).toHaveCount(0)

    await expectHighlight(page, 0, highlight)
    await expectHighlight(page, 1, false)
    await expectHighlight(page, 2, false)

    await expectText(page, 0, highlightText, highlightLabel, highlightComment)
    await expectText(page, 1, text, label, comment)
    await expectText(page, 2, text, label, comment)
  }

  await page.mouse.up()
  await hover(page, 0)
  await expectHighlight(page, 0, highlightHover)
  await expectText(page, 0, highlightText, highlightLabel, highlightComment)

  await press(page, 0)
  await expectHighlight(page, 0, highlight)
  await expectText(page, 0, highlightTextPress, highlightLabel, highlightComment)
})

test('User theme, no mark, hover move', async ({ page }) => {
  await init(page)
  await setStyle(page, { ...style, Highlight: { HoverBehavior: 'Move' } })
  await setCandidates(page, [{}, {}, {}], 0)

  await hover(page, 2)
  await expect(mark(page, 0)).toHaveCount(0)
  await expect(mark(page, 1)).toHaveCount(0)
  await expect(mark(page, 2)).toHaveCSS('opacity', '0')
  await expectHighlight(page, 0, false)
  await expectHighlight(page, 1, false)
  await expectHighlight(page, 2, highlightHover)
  await expectText(page, 0, text, label, comment)
  await expectText(page, 1, text, label, comment)
  await expectText(page, 2, highlightText, highlightLabel, highlightComment)

  await press(page, 2)
  await expect(mark(page, 0)).toHaveCount(0)
  await expect(mark(page, 1)).toHaveCount(0)
  await expect(mark(page, 2)).toHaveCSS('opacity', '0')
  await expectHighlight(page, 0, false)
  await expectHighlight(page, 1, false)
  await expectHighlight(page, 2, highlight)
  await expectText(page, 0, text, label, comment)
  await expectText(page, 1, text, label, comment)
  await expectText(page, 2, highlightTextPress, highlightLabel, highlightComment)
})

test('User theme, no mark, hover add', async ({ page }) => {
  await init(page)
  await setStyle(page, { ...style, Highlight: { HoverBehavior: 'Add' } })
  await setCandidates(page, [{}, {}, {}], 0)

  await hover(page, 2)
  await expect(mark(page, 0)).toHaveCSS('opacity', '0')
  await expect(mark(page, 1)).toHaveCount(0)
  await expect(mark(page, 2)).toHaveCount(0)
  await expectHighlight(page, 0, highlight)
  await expectHighlight(page, 1, false)
  await expectHighlight(page, 2, highlight)
  await expectText(page, 0, highlightText, highlightLabel, highlightComment)
  await expectText(page, 1, text, label, comment)
  await expectText(page, 2, highlightText, highlightLabel, highlightComment)

  await press(page, 2)
  await expect(mark(page, 0)).toHaveCSS('opacity', '0')
  await expect(mark(page, 1)).toHaveCount(0)
  await expect(mark(page, 2)).toHaveCount(0)
  await expectHighlight(page, 0, highlight)
  await expectHighlight(page, 1, false)
  await expectHighlight(page, 2, highlightHover)
  await expectText(page, 0, highlightText, highlightLabel, highlightComment)
  await expectText(page, 1, text, label, comment)
  await expectText(page, 2, highlightTextPress, highlightLabel, highlightComment)
})

test.describe('Mark bar, no hover', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Bar' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const { action, height } of [
        { action: async () => {}, height: '16px' },
        { action: () => hover(page, 0), height: '16px' },
        { action: () => press(page, 0), height: '12px' },
      ]) {
        await action()
        await expect(mark(page, 0)).toHaveCSS('background-color', markColor)
        await expect(mark(page, 0)).toHaveCSS('height', height)
        await expect(mark(page, 0)).toHaveCSS('width', '3px')
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 2)).toHaveCount(0)
      }
    })
  }
})

test.describe('Mark bar, hover move', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Bar', HoverBehavior: 'Move' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const { action, height } of [
        { action: () => hover(page, 2), height: '16px' },
        { action: () => press(page, 2), height: '12px' },
      ]) {
        await action()
        await expect(mark(page, 0)).toHaveCount(0)
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 2)).toHaveCSS('background-color', markColor)
        await expect(mark(page, 2)).toHaveCSS('height', height)
      }
    })
  }
})

test.describe('Mark bar, hover add', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Bar', HoverBehavior: 'Add' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [() => hover(page, 2), () => press(page, 2)]) {
        await action()
        await expect(mark(page, 0)).toHaveCSS('background-color', markColor)
        await expect(mark(page, 0)).toHaveCSS('height', '16px')
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 2)).toHaveCount(0)
      }
    })
  }
})

test.describe('Mark text, no hover, horizontal', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [async () => {}, () => hover(page, 0), () => press(page, 0)]) {
        await action()
        await expect(mark(page, 0)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 0)).toHaveCSS('color', markColor)
        await expect(mark(page, 0)).toHaveText('🐧')
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 2)).toHaveCount(0)
      }
    })
  }
})

test.describe('Mark text, no hover, horizontal, different widths', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setLayout(page, VERTICAL)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [async () => {}, () => hover(page, 0), () => press(page, 0)]) {
        await action()
        await expect(mark(page, 0)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 0)).toHaveCSS('color', markColor)
        await expect(mark(page, 0)).toHaveCSS('opacity', '1')
        for (let i = 0; i < 3; ++i) {
          await expect(mark(page, i)).toHaveText('🐧')
        }
        await expect(mark(page, 1)).toHaveCSS('opacity', '0')
        await expect(mark(page, 2)).toHaveCSS('opacity', '0')
      }
    })
  }
})

test.describe('Mark text, hover move, horizontal', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text', HoverBehavior: 'Move' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [() => hover(page, 2), () => press(page, 2)]) {
        await action()
        await expect(mark(page, 0)).toHaveCount(0)
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 2)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 2)).toHaveCSS('color', markColor)
        await expect(mark(page, 2)).toContainText('🐧')
      }
    })
  }
})

test.describe('Mark text, hover move, vertical', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setLayout(page, VERTICAL)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text', HoverBehavior: 'Move' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [() => hover(page, 2), () => press(page, 2)]) {
        await action()
        for (let i = 0; i < 3; ++i) {
          await expect(mark(page, i)).toHaveText('🐧')
        }
        await expect(mark(page, 0)).toHaveCSS('opacity', '0')
        await expect(mark(page, 1)).toHaveCSS('opacity', '0')
        await expect(mark(page, 2)).toHaveCSS('opacity', '1')
        await expect(mark(page, 2)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 2)).toHaveCSS('color', markColor)
      }
    })
  }
})

test.describe('Mark text, hover add, horizontal', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text', HoverBehavior: 'Add' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [() => hover(page, 2), () => press(page, 2)]) {
        await action()
        await expect(mark(page, 0)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 0)).toHaveCSS('color', markColor)
        await expect(mark(page, 0)).toHaveText('🐧')
        await expect(mark(page, 1)).toHaveCount(0)
        await expect(mark(page, 1)).toHaveCount(0)
      }
    })
  }
})

test.describe('Mark text, hover add, vertical', () => {
  const cases = [
    { name: 'Default theme', style: {}, markColor: white },
    { name: 'User theme', style, markColor: highlightMark },
  ]
  for (const { name, style, markColor } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setLayout(page, VERTICAL)
      await setStyle(page, { ...style, Highlight: { MarkStyle: 'Text', HoverBehavior: 'Add' } })
      await setCandidates(page, [{}, {}, {}], 0)

      for (const action of [() => hover(page, 2), () => press(page, 2)]) {
        await action()
        for (let i = 0; i < 3; ++i) {
          await expect(mark(page, i)).toHaveText('🐧')
        }
        await expect(mark(page, 0)).toHaveCSS('opacity', '1')
        await expect(mark(page, 1)).toHaveCSS('opacity', '0')
        await expect(mark(page, 2)).toHaveCSS('opacity', '0')
        await expect(mark(page, 0)).toHaveCSS('background-color', transparent)
        await expect(mark(page, 0)).toHaveCSS('color', markColor)
      }
    })
  }
})
