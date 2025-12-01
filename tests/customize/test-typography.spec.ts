import { expect, test } from '@playwright/test'
import { VERTICAL, VERTICAL_RL } from '../../page/constant'
import { candidate, getBox, init, setCandidates, setLayout, setStyle, setWritingMode } from '../util'

test('Emoji in vertical-rl', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setWritingMode(page, VERTICAL_RL)

  await setCandidates(page, [
    { text: '🙅‍♂️' }, // Single emoji to be upright.
    { text: '字A🙅‍♂️' }, // Not able to make only emoji upright yet.
    { text: '字A' }, // Control group.
  ], 0)
  await expect(candidate(page, 0).locator('.fcitx-text')).toHaveCSS('writing-mode', 'horizontal-tb')
  await expect(candidate(page, 1).locator('.fcitx-text')).toHaveCSS('writing-mode', 'vertical-rl')
  await expect(candidate(page, 2).locator('.fcitx-text')).toHaveCSS('writing-mode', 'vertical-rl')
})

test('Comments align right in vertical layout', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setCandidates(page, [
    { text: '短', label: '1', comment: '注释1' },
    { text: '长长', label: '2', comment: '注释2' },
  ], 0)
  const shortComment = candidate(page, 0).locator('.fcitx-comment')
  const longComment = candidate(page, 1).locator('.fcitx-comment')
  const leftShortBox = await getBox(shortComment)
  const leftLongBox = await getBox(longComment)
  expect(leftShortBox.x + leftShortBox.width).toBeLessThan(leftLongBox.x + leftLongBox.width)

  await setStyle(page, { Typography: { VerticalCommentsAlignRight: 'True' } })
  const rightShortBox = await getBox(shortComment)
  const rightLongBox = await getBox(longComment)
  expect(rightLongBox.x + rightLongBox.width).toBeGreaterThan(leftLongBox.x + leftLongBox.width)
  expect(rightShortBox.x + rightShortBox.width).toEqual(rightLongBox.x + rightLongBox.width)
})
