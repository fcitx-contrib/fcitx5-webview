import test, { expect } from '@playwright/test'
import { candidate, init, scrollExpand } from './util'

test('Passively expand', async ({ page }) => {
  await init(page)
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  await expect(candidate(page, 0)).toContainClass('fcitx-highlighted')
  const cppCalls = await page.evaluate(() => window.cppCalls)
  expect(cppCalls[0], 'Highlight is set on expand').toEqual({ highlight: 0 })
})
