import { expect, test } from '@playwright/test'

import { candidate, init, setCandidates, setStyle } from '../util'

test('Set font family', async ({ page }) => {
  await init(page)
  await setStyle(page, { Font: { TextFontFamily: { 0: 'cursive', 1: 'Plangothic P1' } } })
  await setCandidates(page, [{ text: '字A' }], 0)
  // WebKit 26.4 gives 'cursive, "Plangothic P1"', while 26.5 removes quote.
  await expect(candidate(page, 0).locator('.fcitx-text')).toHaveCSS('font-family', 'cursive, Plangothic P1')
})
