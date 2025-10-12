import type { Page } from '@playwright/test'
import test, { expect } from '@playwright/test'
import { candidate, followHostTheme, getBox, hover, init, panel, setCandidates, setStyle, transparent } from './util'

test('Horizontal multi-line candidate', async ({ page }) => {
  await init(page)
  const pane = panel(page)

  const singleLine = { text: '一行', label: '1', comment: '注释', actions: [] }
  const multiLine = { text: '多\n行', label: '2', comment: '', actions: [] }
  await setCandidates(page, [singleLine], 0)
  const singleLineHeight = (await getBox(pane)).height

  await setCandidates(page, [singleLine, multiLine], 0)
  const { height: multiLineHeight, y } = await getBox(pane)
  expect(multiLineHeight).toBeGreaterThan(singleLineHeight)

  const singleLineCandidate = candidate(page, 0)
  const middleY = y + multiLineHeight / 2
  const labelBox = await getBox(singleLineCandidate.locator('.fcitx-label'))
  const textBox = await getBox(singleLineCandidate.locator('.fcitx-text'))
  const commentBox = await getBox(singleLineCandidate.locator('.fcitx-comment'))
  expect((labelBox.y + labelBox.height / 2), 'Label is centralized vertically').toEqual(middleY)
  expect((textBox.y + textBox.height / 2), 'Text is centralized vertically').toEqual(middleY)
  expect((commentBox.y + commentBox.height / 2), 'Comment is centralized vertically').toEqual(middleY)
})

test.describe('Ghost stripe default positive margin', () => {
  const cases = [
    { name: 'System (macOS 26)', preset: (page: Page) => followHostTheme(page, 'macOS', 26) },
    { name: 'macOS 26', preset: (page: Page) => setStyle(page, { Basic: { DefaultTheme: 'macOS 26' } }) },
  ]
  for (const { name, preset } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await preset(page)
      await setCandidates(page, [{}, {}, {}], 0)
      for (const i of [0, 1, 2]) {
        await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
      }
    })
  }
})

test.describe('Ghost stripe default zero margin', () => {
  const cases = [
    { name: 'System (macOS 15)', preset: (page: Page) => followHostTheme(page, 'macOS', 15) },
    { name: 'macOS 15', preset: (page: Page) => setStyle(page, { Basic: { DefaultTheme: 'macOS 15' } }) },
  ]
  for (const { name, preset } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await preset(page)
      await setCandidates(page, [{}, {}, {}], 0)
      await expect(candidate(page, 0)).toHaveCSS('background-color', transparent)
      for (const i of [1, 2]) {
        await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
      }
    })
  }
})

test.describe('Ghost stripe override positive margin', () => {
  const cases: { name: string, HoverBehavior: STYLE_JSON['Highlight']['HoverBehavior'] }[] = [
    { name: 'No hover', HoverBehavior: 'None' },
    { name: 'Hover add', HoverBehavior: 'Add' },
  ]
  for (const { name, HoverBehavior } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { Highlight: { HoverBehavior }, Size: { OverrideDefault: 'True', Margin: '2' } })
      await setCandidates(page, [{}, {}, {}], 0)
      for (const i of [0, 1, 2]) {
        await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
      }

      await hover(page, 1)
      for (const i of [0, 1, 2]) {
        await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
      }
    })
  }
})

test.describe('Ghost stripe override zero margin', () => {
  const cases: { name: string, HoverBehavior: STYLE_JSON['Highlight']['HoverBehavior'], transparentIndicesOnHover: number[] }[] = [
    { name: 'No hover', HoverBehavior: 'None', transparentIndicesOnHover: [0] },
    { name: 'Hover add', HoverBehavior: 'Add', transparentIndicesOnHover: [0, 1] },
  ]
  for (const { name, HoverBehavior, transparentIndicesOnHover } of cases) {
    test(name, async ({ page }) => {
      await init(page)
      await setStyle(page, { Highlight: { HoverBehavior }, Size: { OverrideDefault: 'True', Margin: '0' } })
      await setCandidates(page, [{}, {}, {}], 0)
      await expect(candidate(page, 0)).toHaveCSS('background-color', transparent)
      for (const i of [1, 2]) {
        await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
      }

      await hover(page, 1)
      for (const i of [0, 1, 2]) {
        if (transparentIndicesOnHover.includes(i)) {
          await expect(candidate(page, i)).toHaveCSS('background-color', transparent)
        }
        else {
          await expect(candidate(page, i)).not.toHaveCSS('background-color', transparent)
        }
      }
    })
  }
})
