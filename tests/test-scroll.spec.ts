import test, { expect } from '@playwright/test'
import { candidate, getBox, init, scrollExpand } from './util'

test('Passively expand', async ({ page }) => {
  await init(page)
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  await expect(candidate(page, 0)).toContainClass('fcitx-highlighted')
  const cppCalls = await page.evaluate(() => window.cppCalls)
  // Order of highlight and resize event is random.
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"highlight":0}').length, 'Highlight is set on expand').toEqual(1)
})

test('With less candidates, scroll bar shows in animation and hides when done, but should not cause layout shift.', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    const style = document.createElement('style')
    // 392 < 66 * 6 < 400, so with scroll bar in animation the first row can only have 5 candidates.
    style.innerHTML = `
      .fcitx-candidate {
        width: 66px;
      }
    `
    document.head.append(style)
  })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  while ((await getBox(page.locator('.fcitx-hoverables'))).height !== 60);
  const firstBox = await getBox(candidate(page, 0))
  const sixthBox = await getBox(candidate(page, 5))
  expect(firstBox.x).toEqual(sixthBox.x)
  expect(firstBox.y).toBeLessThan(sixthBox.y)
})
