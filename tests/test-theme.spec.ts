import {
  test,
  expect
} from '@playwright/test'
import {
  panel,
  init
} from './util'

test('Set accent color', async ({ page }) => {
  await init(page)

  const cases = [
    [null, 'blue'],
    [-1, 'graphite'],
    [0, 'red'],
    [1, 'orange'],
    [2, 'yellow'],
    [3, 'green'],
    [4, 'blue'],
    [5, 'purple'],
    [6, 'pink']
  ] as [number | null, string][]

  for (const [value, color] of cases) {
    await page.evaluate(value => window.setAccentColor(value), value)
    await expect(panel(page)).toHaveClass(new RegExp(color))
  }
})
