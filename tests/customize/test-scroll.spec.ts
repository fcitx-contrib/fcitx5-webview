import { expect, test } from '@playwright/test'
import { candidate, getCppCalls, init, panel, scrollExpand, setStyle } from '../util'

test('Row, column and cell width', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxRowCount: '2', MaxColumnCount: '3' },
    Size: { OverrideDefault: 'True', ScrollCellWidth: '50' },
  })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  const pane = panel(page)
  await expect(pane).toHaveCSS('width', '160px')
  await expect(pane).toHaveCSS('height', '60px')
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '10' },
  })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
  await expect(candidate(page, 10).locator('.fcitx-label')).toHaveText('0')

  await page.evaluate(() => {
    window.fcitx.scrollKeyAction(0)
    window.fcitx.scrollKeyAction(1)
  })
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => 'select' in call)).toEqual([{ select: [9] }, { select: [0] }])
})

test('Hide scrollbar', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { ShowScrollBar: 'False' },
  })
  await scrollExpand(page, Array.from({ length: 42 }).map((_, i) => (i + 1).toString()))
  const pane = panel(page)
  await expect(pane).toHaveCSS('width', '390px')
})
