import { expect, test } from '@playwright/test'
import { candidate, hoverables, init, setCandidates, setStyle, transparent } from '../util'

test('Internet image', async ({ page }) => {
  await init(page)
  await setCandidates(page, [{}], -1)
  await expect(candidate(page, 0).locator('.fcitx-candidate-background')).not.toHaveCSS('background-color', transparent)

  const image = 'https://example.org/img.png'
  await setStyle(page, { DarkMode: { OverrideDefault: 'True', PanelColor: '#123456' }, Background: { ImageUrl: image } })
  await expect(hoverables(page)).toHaveCSS('background-image', `url("${image}")`)
  await expect(candidate(page, 0).locator('.fcitx-candidate-background')).toHaveCSS('background-color', transparent)

  await setStyle(page, { DarkMode: { OverrideDefault: 'True', PanelColor: '#123456' }, Background: { ImageUrl: image, KeepPanelColorWhenHasImage: 'True' } })
  await expect(candidate(page, 0).locator('.fcitx-candidate-background')).toHaveCSS('background-color', 'rgb(18, 52, 86)')
})

test('Local image', async ({ page }) => {
  await init(page)
  const image = 'fcitx://test.png'
  await setStyle(page, { Background: { ImageUrl: image } })
  await expect(hoverables(page)).toHaveCSS('background-image', /url\("fcitx:\/\/test\.png\?r=\d+(\.\d+)?"\)/)
})
