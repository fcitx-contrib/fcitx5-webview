import type { Page } from '@playwright/test'
import test, { expect } from '@playwright/test'
import { HORIZONTAL, VERTICAL } from '../page/constant'
import { candidate, getBox, getTextBox, init, panel, scroll, scrollExpand, setCandidates, setLayout, setStyle, updateInputPanel } from './util'

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

test('Multi-space and tab', async ({ page }) => {
  await init(page)

  await setCandidates(page, [{ text: '基准 单空格  双空格\t制表符' }], 0)
  const text = panel(page).locator('.fcitx-text')
  const rects: Record<number, DOMRect> = {}
  for (const i of [0, 1, 3, 5, 8, 11]) {
    rects[i] = await getTextBox(text, i)
  }
  const base = rects[1].left - rects[0].right
  const single = rects[3].left - rects[1].right
  const double = rects[8].left - rects[5].right
  const tab = rects[11].width

  expect(base).toBe(0)
  expect(single).toBe(4)
  expect(double).toBe(8)
  expect(tab).toBeGreaterThan(double)
})

const shortPreedit = '短'
const longPreedit = '长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长'

test.describe('Extremely long preedit horizontal', () => {
  const cases = [{ name: 'With paging buttons', pageable: true }, { name: 'Without paging buttons', pageable: false }]
  for (const { name, pageable } of cases) {
    test(name, async ({ page }) => {
      await init(page)

      const lastDivider = page.locator('.fcitx-divider').nth(pageable ? -2 : -1)
      const pagingDivider = pageable ? page.locator('.fcitx-divider').nth(-1) : page.locator('div' /* dummy */)
      await updateInputPanel(page, shortPreedit)
      await setCandidates(page, [{ text: '1' }], 0, pageable)
      if (pageable) {
        await expect(pagingDivider).toHaveCSS('width', '1px')
      }
      await expect(lastDivider, 'Last divider is hidden by default').toHaveCSS('width', '0px')

      await updateInputPanel(page, longPreedit)
      if (pageable) {
        await expect(pagingDivider).toHaveCSS('width', '1px')
      }
      const box = await getBox(lastDivider)
      expect(box.width, 'Last divider has width if preedit is too long').toBeGreaterThan(400)
      await expect(lastDivider.locator('.fcitx-divider-middle'), 'Middle part that has divider color is hidden').toHaveCSS('height', '0px')
      const upperSide = lastDivider.locator('.fcitx-divider-side').first()
      const lowerSide = lastDivider.locator('.fcitx-divider-side').last()
      await expect(upperSide, 'Side parts split divider evenly').toHaveCSS('height', '14px')
      await expect(lowerSide).toHaveCSS('height', '14px')
      await expect(upperSide, 'Divider has panel color').toHaveCSS('background-color', 'rgba(40, 40, 40, 0.71)')
      await expect(lowerSide).toHaveCSS('background-color', 'rgba(40, 40, 40, 0.71)')
    })
  }
})

test('Extremely long preedit scroll', async ({ page }) => {
  await init(page)

  const header = page.locator('.fcitx-header')
  await updateInputPanel(page, '短')
  await scrollExpand(page, ['1'])
  await expect(header).toHaveCSS('width', '400px')
  await expect(header).toHaveCSS('height', '28px')

  await updateInputPanel(page, longPreedit)
  await expect(header).toHaveCSS('width', '400px')
  await expect(header, 'Width is restricted so text is wrapped').toHaveCSS('height', '36px')
})

async function getLabelWidths(page: Page, indices: number[]) {
  const boxes = await Promise.all(indices.map(i => getBox(candidate(page, i).locator('.fcitx-label'))))
  return boxes.map(box => box.width)
}

test('Uneven label width in vertical mode', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setStyle(page, { Font: { LabelFontFamily: { 0: 'PingFang SC' } } })

  await setCandidates(page, [{ label: '1' }, { label: '2' }], 0)
  const widths = await getLabelWidths(page, [0, 1])
  expect(widths[0], 'Even label width for vertical').toEqual(widths[1])

  await setLayout(page, HORIZONTAL)
  await setCandidates(page, [{ label: '1' }, { label: '2' }], 0)
  const newWidths = await getLabelWidths(page, [0, 1])
  expect(newWidths[0], 'Revert to baseline: PingFang SC\'s 1 and 2 are not equal width.').not.toEqual(newWidths[1])
})

test('Uneval label width in scroll mode', async ({ page }) => {
  await init(page)
  await setStyle(page, { ScrollMode: { MaxColumnCount: '2', MaxRowCount: '2' }, Font: { LabelFontFamily: { 0: 'PingFang SC' } } })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6'])
  const widths = await getLabelWidths(page, [0, 2])
  expect(widths[0], 'Even label width for first candidates of different rows').toEqual(widths[1])

  // Necessary to test this since --label-width could be cleared, which should not happen during scroll mode.
  await scroll(page, ['7', '8'], false)
  const width = (await getLabelWidths(page, [6]))[0]
  expect(width, 'When more candidates come, width is preserved.').toEqual(widths[0])
})
