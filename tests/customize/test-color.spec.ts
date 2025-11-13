import type { PartialStyle } from '../util'
import { expect, test } from '@playwright/test'
import { init, setStyle, updateInputPanel } from '../util'

const PRE_CARET = '<div class="fcitx-pre-caret">pre</div>'
const POST_CARET = '<div class="fcitx-post-caret">post</div>'
const CARET = '<div class="fcitx-caret fcitx-no-text"></div>'
const CARET_TEXT = '<div class="fcitx-caret">‸</div>'

test('Indicator', async ({ page }) => {
  await init(page)

  const auxUp = page.locator('.fcitx-aux-up')
  await setStyle(page, {
    DarkMode: { OverrideDefault: 'True', AuxColor: '#FF0000' },
    LightMode: { OverrideDefault: 'True', AuxColor: '#00FF00' },
  })
  await updateInputPanel(page, '', 'en')
  await expect(auxUp).toHaveCSS('color', 'rgb(255, 0, 0)')

  await page.evaluate(() => window.fcitx.setTheme(1))
  await expect(auxUp).toHaveCSS('color', 'rgb(0, 255, 0)')
})

test('Preedit text', async ({ page }) => {
  await init(page)

  const preCaret = page.locator('.fcitx-pre-caret')
  const postCaret = page.locator('.fcitx-post-caret')
  await setStyle(page, {
    DarkMode: { OverrideDefault: 'True', PreeditColorPreCaret: '#FF0000', PreeditColorPostCaret: '#00FF00' },
    LightMode: { OverrideDefault: 'True', PreeditColorPreCaret: '#0000FF', PreeditColorPostCaret: '#FFFF00' },
  })
  await updateInputPanel(page, PRE_CARET + CARET + POST_CARET)
  await expect(preCaret).toHaveCSS('color', 'rgb(255, 0, 0)')
  await expect(postCaret).toHaveCSS('color', 'rgb(0, 255, 0)')

  await page.evaluate(() => window.fcitx.setTheme(1))
  await expect(preCaret).toHaveCSS('color', 'rgb(0, 0, 255)')
  await expect(postCaret).toHaveCSS('color', 'rgb(255, 255, 0)')
})

test('Preedit caret', async ({ page }) => {
  await init(page)

  const caret = page.locator('.fcitx-caret')
  const colorStyle: PartialStyle = {
    DarkMode: { OverrideDefault: 'True', PreeditColorCaret: '#FF0000' },
    LightMode: { OverrideDefault: 'True', PreeditColorCaret: '#00FF00' },
  }
  await setStyle(page, colorStyle)
  await updateInputPanel(page, PRE_CARET + CARET + POST_CARET)
  await expect(caret).toHaveCSS('background-color', 'rgb(255, 0, 0)')

  await page.evaluate(() => window.fcitx.setTheme(1))
  await expect(caret).toHaveCSS('background-color', 'rgb(0, 255, 0)')

  await setStyle(page, { ...colorStyle, Caret: {
    Style: 'Text',
  } })
  await updateInputPanel(page, PRE_CARET + CARET_TEXT + POST_CARET)
  await expect(caret).toHaveCSS('color', 'rgb(0, 255, 0)')

  await page.evaluate(() => window.fcitx.setTheme(2))
  await expect(caret).toHaveCSS('color', 'rgb(255, 0, 0)')
})
