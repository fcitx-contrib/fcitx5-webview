import { expect, test } from '@playwright/test'
import { getBox, init, panel, scrollExpand, updateInputPanel } from './util'

test('Panel width', async ({ page }) => {
  await init(page)
  const pane = panel(page)
  const center = page.locator('.fcitx-panel-center')

  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .fcitx-panel-left, .fcitx-panel-right {
        background-color: red;
        height: 40px;
        width: 200px;
      }
      .fcitx-panel-center  {
        background-color: green;
        min-width: 200px;
        height: 40px;
      }
    `
    document.head.append(style)
  })

  await updateInputPanel(page, '', 'en')
  const narrowBox = await getBox(pane)
  expect(narrowBox.width).toBeLessThan(40)
  await expect(center).toHaveCSS('width', '200px')

  await updateInputPanel(page, 'chang')
  await scrollExpand(page, ['长'])
  await expect(pane).toHaveCSS('width', '400px')
  await expect(pane).toHaveCSS('height', '56px')
  await expect(center).toHaveCSS('width', '401px')
})
