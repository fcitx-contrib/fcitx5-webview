import {
  expect,
  test,
} from '@playwright/test'
import {
  init,
  theme,
} from './util'

test('Set accent color', async ({ page }) => {
  await init(page)

  const cases = [
    [null, 'fcitx-blue'],
    [-1, 'fcitx-graphite'],
    [0, 'fcitx-red'],
    [1, 'fcitx-orange'],
    [2, 'fcitx-yellow'],
    [3, 'fcitx-green'],
    [4, 'fcitx-blue'],
    [5, 'fcitx-purple'],
    [6, 'fcitx-pink'],
  ] as [number | null, string][]

  for (const [value, color] of cases) {
    await page.evaluate(value => window.fcitx.setAccentColor(value), value)
    await expect(theme(page)).toContainClass(color)
  }
})
