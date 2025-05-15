import { expect, test } from '@playwright/test'
import { candidate, init, setCandidates, theme } from './util'

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

test('Set App accent color', async ({ page }) => {
  await init(page)
  await page.evaluate(() => window.fcitx.setAccentColor('#12345678'))
  await setCandidates(page, [
    { text: '高亮', label: '1', comment: '', actions: [] },
    { text: '普通', label: '2', comment: '', actions: [] },
  ], 0)
  const highlightedCandidate = candidate(page, 0)
  await expect(highlightedCandidate).toHaveCSS('background-color', 'rgba(18, 52, 86, 0.47)')

  await page.evaluate(() => window.fcitx.setAccentColor(null))
  await expect(highlightedCandidate).toHaveCSS('background-color', 'rgb(0, 89, 208)')
})
