import test, { expect } from '@playwright/test'
import { getBox, getCppCalls, init, setStyle } from './util'

function cands() {
  return Array.from({ length: 24 }, (_, i) => (i + 1).toString()).map(text => ({ text, label: '', comment: '', actions: [], spaceBetweenComment: true }))
}

const tabActions = [
  { id: 1, text: 'xi', checked: true },
  { id: 2, text: 'xian' },
  { id: 3, text: '', separator: true },
  { id: 4, text: '单字', checked: true },
  { id: 5, text: '笔画' },
]

const snapshotOptions = { clip: { x: 0, y: 0, width: 500, height: 400 }, threshold: 0.01 }

test('Tab actions', async ({ page }) => {
  await init(page)
  await setStyle(page, { ScrollMode: { Animation: 'False' } })

  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, 0, false, false, false, 1, false, false, tabActions), { cands: cands(), tabActions })
  const tabs = page.locator('.fcitx-tabs')
  await expect(tabs, 'Tab actions are shown only in scroll mode').not.toBeVisible()

  const candidateBackground = page.locator('.fcitx-candidate-background').first()
  const candidateBackgroundColor = await candidateBackground.evaluate(element => getComputedStyle(element).backgroundColor)
  const divider = page.locator('.fcitx-divider-paging .fcitx-divider-middle')
  const dividerColor = await divider.evaluate(element => getComputedStyle(element).backgroundColor)

  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(), tabActions })
  await expect(tabs).toBeVisible()
  await expect(tabs).toHaveCSS('background-color', candidateBackgroundColor)
  await expect(tabs).toHaveCSS('border-block-start-width', '1px')
  await expect(tabs).toHaveCSS('border-block-start-color', dividerColor)

  const scrollableTabs = tabs.locator('.fcitx-tabs-scrollable .fcitx-tab')
  const pinnedTabs = tabs.locator('.fcitx-tabs-pinned .fcitx-tab')
  await expect(scrollableTabs).toHaveCount(2)
  await expect(pinnedTabs).toHaveCount(2)

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

  const tab = page.locator('.fcitx-tab')
  await expect(tab).toHaveCount(4)
  for (const i of [0, 2]) {
    await expect(tab.nth(i)).toContainClass('fcitx-highlighted')
  }
  for (const i of [1, 3]) {
    await expect(tab.nth(i)).not.toContainClass('fcitx-highlighted')
  }

  const highlightedTabInner = tab.first().locator('.fcitx-tab-inner')
  const highlightColor = await highlightedTabInner.evaluate(element => getComputedStyle(element).backgroundColor)
  const normalTabInner = tab.nth(1).locator('.fcitx-tab-inner')
  const normalTabBox = await getBox(tab.nth(1))
  await page.mouse.move(
    normalTabBox.x + normalTabBox.width / 2,
    normalTabBox.y + normalTabBox.height / 2,
  )
  await page.mouse.down()
  await expect(normalTabInner).toHaveCSS('background-color', highlightColor)
  await page.mouse.up()

  await tab.first().click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"tabAction":[1]}').length).toEqual(1)
})

test('Tab actions snapshot', async ({ page }) => {
  async function collapse(height: number) {
    await page.locator('.fcitx-hoverables').evaluate((element: HTMLElement, height) => {
      element.style.maxBlockSize = `${height}px`
    }, height)
  }

  await init(page)
  await setStyle(page, { ScrollMode: { Animation: 'False' } })
  await page.evaluate(({ cands, tabActions }) =>
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false, tabActions), { cands: cands(), tabActions })
  await expect(page).toHaveScreenshot('tab-actions.png', snapshotOptions)

  await collapse(126)
  await expect(page).toHaveScreenshot('tab-actions-collapse-begin.png', snapshotOptions)

  await collapse(56)
  await expect(page).toHaveScreenshot('tab-actions-collapse-middle.png', snapshotOptions)
})
