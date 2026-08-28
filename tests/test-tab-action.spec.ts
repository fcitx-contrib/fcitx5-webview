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
  const divider = page.locator('.fcitx-divider-paging .fcitx-divider-middle')
  const dividerColor = await divider.evaluate(element => getComputedStyle(element).backgroundColor)

  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(texts), tabActions })
  await expect(panel(page)).toHaveClass(/fcitx-has-tab-actions/)

  const tab = page.locator('.fcitx-tab')
  await expect(tab).toHaveCount(4)
  const candidateBackground = page.locator('.fcitx-candidate-background').first()
  const candidateBackgroundColor = await candidateBackground.evaluate(element => getComputedStyle(element).backgroundColor)
  const tabs = page.locator('.fcitx-tabs')
  await expect(tabs).toHaveCSS('background-color', candidateBackgroundColor)
  await expect(tabs).toHaveCSS('border-block-start-width', '1px')
  await expect(tabs).toHaveCSS('border-block-start-color', dividerColor)
  for (const i of [0, 2]) {
    await expect(tab.nth(i)).toContainClass('fcitx-highlighted')
  }
  for (const i of [1, 3]) {
    await expect(tab.nth(i)).not.toContainClass('fcitx-highlighted')
  }

  const highlightedTabInner = tab.first().locator('.fcitx-tab-inner')
  const highlightColor = await highlightedTabInner.evaluate(element => getComputedStyle(element).backgroundColor)
  const unhighlightedTabInner = tab.nth(1).locator('.fcitx-tab-inner')
  await unhighlightedTabInner.dispatchEvent('pointerdown', { button: 0 })
  await expect(tab.nth(1)).toContainClass('fcitx-pressed')
  await expect(unhighlightedTabInner).toHaveCSS('background-color', highlightColor)
  await page.locator('body').dispatchEvent('pointerup', { button: 0 })
  await expect(tab.nth(1)).not.toContainClass('fcitx-pressed')

  await tab.first().click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"tabAction":[1]}').length).toEqual(1)
})

test('Actions after a separator are pinned at the right end', async ({ page }) => {
  await init(page)
  const texts = Array.from({ length: 24 }, (_, i) => (i + 1).toString())
  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(texts), tabActions })

  const tabs = page.locator('.fcitx-tabs')
  const scrollableTabs = tabs.locator('.fcitx-tabs-scrollable .fcitx-tab')
  const pinnedTabs = tabs.locator('.fcitx-tabs-pinned .fcitx-tab')
  await expect(scrollableTabs).toHaveCount(2)
  await expect(pinnedTabs).toHaveCount(2)

  // Tabs are shown as a row below the candidates, like the desktop candidate window.
  const tabsBox = await getBox(tabs)
  const candidatesBox = await getBox(page.locator('.fcitx-scroll-area'))
  expect(
    tabsBox.y - (candidatesBox.y + candidatesBox.height),
    'Tabs should be below candidates',
  ).toBeGreaterThanOrEqual(-1)

  const lastTabBox = await getBox(tabs.locator('.fcitx-tab').last())
  expect(
    Math.abs(lastTabBox.x + lastTabBox.width - (tabsBox.x + tabsBox.width)),
    'Last tab should be pinned at the right end',
  ).toBeLessThan(1)

  await pinnedTabs.first().click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"tabAction":[4]}').length).toEqual(1)
})
