import test, { expect } from '@playwright/test'
import { candidate, getBox, init, panel, setCandidates } from './util'

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
