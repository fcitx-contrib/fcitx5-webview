import test, { expect } from '@playwright/test'
import { getBox, getCppCalls, init, panel } from './util'

function cands(texts: string[]) {
  return texts.map(text => ({ text, label: '', comment: '', actions: [], spaceBetweenComment: true }))
}

const tabActions = [
  { id: 1, text: 'xi', checked: true },
  { id: 2, text: 'xian' },
  { id: 3, text: '', separator: true },
  { id: 4, text: '单字', checked: true },
  { id: 5, text: '笔画' },
]

test('Tab actions are shown only in scroll mode', async ({ page }) => {
  await init(page)
  const texts = Array.from({ length: 24 }, (_, i) => (i + 1).toString())

  // Actions are ignored when not in scroll mode.
  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, 0, false, false, false, 1, false, false, tabActions), { cands: cands(texts), tabActions })
  await expect(panel(page)).not.toHaveClass(/fcitx-has-tab-actions/)

  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(texts), tabActions })
  await expect(panel(page)).toHaveClass(/fcitx-has-tab-actions/)

  const tab = page.locator('.fcitx-tab')
  await expect(tab).toHaveCount(4)
  for (const i of [0, 2]) {
    await expect(tab.nth(i)).toContainClass('fcitx-highlighted')
  }
  for (const i of [1, 3]) {
    await expect(tab.nth(i)).not.toContainClass('fcitx-highlighted')
  }

  await tab.first().click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"tabAction":[1]}').length).toEqual(1)
})

test('Actions after a separator are pinned at the bottom', async ({ page }) => {
  await init(page)
  const texts = Array.from({ length: 24 }, (_, i) => (i + 1).toString())
  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(texts), tabActions })

  const tabs = page.locator('.fcitx-tabs')
  const scrollableTabs = tabs.locator('.fcitx-tabs-scrollable .fcitx-tab')
  const pinnedTabs = tabs.locator('.fcitx-tabs-pinned .fcitx-tab')
  await expect(scrollableTabs).toHaveCount(2)
  await expect(pinnedTabs).toHaveCount(2)

  const lastTabBox = await getBox(tabs.locator('.fcitx-tab').last())
  const tabsBox = await getBox(tabs)
  expect(
    Math.abs(lastTabBox.y + lastTabBox.height - (tabsBox.y + tabsBox.height)),
    'Last tab should be pinned at the bottom',
  ).toBeLessThan(1)

  await pinnedTabs.first().click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"tabAction":[4]}').length).toEqual(1)
})
