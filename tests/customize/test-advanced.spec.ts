import { expect, test } from '@playwright/test'
import { init, setStyle } from '../util'

test('Advanced.UserCss', async ({ page }) => {
  await init(page)

  const customCss = 'fcitx:///file/css/style.css'
  await setStyle(page, {
    Advanced: {
      UserCss: customCss,
    },
  })

  const link = page.locator('#fcitx-user')
  await expect(link).toHaveAttribute('href', /^fcitx:\/\/\/file\/css\/style\.css\?r=/)
})
