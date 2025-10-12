import { expect, test } from '@playwright/test'
import { init, panel, setStyle } from '../util'

test('Round corner of expand button', async ({ page }) => {
  await init(page)
  await setStyle(page, { Size: { OverrideDefault: 'True', Margin: '4', TopPadding: '1', BottomPadding: '1' } })

  await page.evaluate(() =>
    window.fcitx.setCandidates([{ text: '1', label: '1', comment: '', actions: [] }], 0, '', true, false, true, 1, false, false))
  const pane = panel(page)
  await expect(pane).toHaveCSS('border-start-end-radius', '17px')
  await expect(pane).toHaveCSS('border-end-end-radius', '17px')
})
