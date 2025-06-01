import { expect, test } from '@playwright/test'
import { VERTICAL, VERTICAL_RL } from '../../page/constant'
import { candidate, init, setCandidates, setLayout, setWritingMode } from '../util'

test('Emoji in vertical-rl', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setWritingMode(page, VERTICAL_RL)

  await setCandidates(page, [
    { text: '🙅‍♂️', label: '', comment: '', actions: [] }, // Single emoji to be upright.
    { text: '字A🙅‍♂️', label: '', comment: '', actions: [] }, // Not able to make only emoji upright yet.
    { text: '字A', label: '', comment: '', actions: [] }, // Control group.
  ], 0)
  await expect(candidate(page, 0).locator('.fcitx-text')).toHaveCSS('writing-mode', 'horizontal-tb')
  await expect(candidate(page, 1).locator('.fcitx-text')).toHaveCSS('writing-mode', 'vertical-rl')
  await expect(candidate(page, 2).locator('.fcitx-text')).toHaveCSS('writing-mode', 'vertical-rl')
})
