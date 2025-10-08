import { expect, test } from '@playwright/test'
import { candidate, hoverables, init, setCandidates, setStyle } from '../util'

test('Internet image', async ({ page }) => {
  await init(page)
  await setCandidates(page, [{}], -1)
  const transparent = 'rgba(0, 0, 0, 0)'
  await expect(candidate(page, 0)).not.toHaveCSS('background-color', transparent)

  const image = 'https://example.org/img.png'
  await setStyle(page, { DarkMode: { PanelColor: '#123456' }, Background: { ImageUrl: image } })
  await expect(hoverables(page)).toHaveCSS('background-image', `url("${image}")`)
  await expect(candidate(page, 0)).toHaveCSS('background-color', transparent)
})

test('Local image', async ({ page }) => {
  await init(page)
  const image = 'fcitx://test.png'
  await setStyle(page, { Background: { ImageUrl: image } })
  await expect(hoverables(page)).toHaveCSS('background-image', /url\("fcitx:\/\/test\.png\?r=\d+(\.\d+)?"\)/)
})
