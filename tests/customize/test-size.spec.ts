import { expect, test } from '@playwright/test'
import { VERTICAL } from '../../page/constant'
import { candidate, init, panel, setCandidates, setLayout, setStyle } from '../util'

test('Independent sizes', async ({ page }) => {
  await init(page)

  await setLayout(page, VERTICAL)
  await setStyle(page, { Size: {
    OverrideDefault: 'True',
    BorderRadius: '4',
    BorderWidth: '2',
    HighlightRadius: '3',
    TopPadding: '4',
    RightPadding: '2',
    BottomPadding: '5',
    LeftPadding: '1',
    LabelTextGap: '3',
    VerticalMinWidth: '180',
  } })
  await setCandidates(page, [{}], 0)
  await expect(panel(page)).toHaveCSS('border-radius', '4px')
  await expect(panel(page)).toHaveCSS('border-width', '2px')
  const candidateInner = candidate(page, 0).locator('.fcitx-candidate-inner')
  await expect(candidateInner).toHaveCSS('border-radius', '3px')
  await expect(candidateInner).toHaveCSS('padding-top', '4px')
  await expect(candidateInner).toHaveCSS('padding-right', '2px')
  await expect(candidateInner).toHaveCSS('padding-bottom', '5px')
  await expect(candidateInner).toHaveCSS('padding-left', '1px')
  await expect(candidateInner).toHaveCSS('gap', '3px')
  await expect(panel(page)).toHaveCSS('width', '180px')
})
