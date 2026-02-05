import test, { expect } from '@playwright/test'
import { HORIZONTAL, VERTICAL, VERTICAL_LR, VERTICAL_RL } from '../page/constant'
import { hover, init, setCandidates, setLayout, setStyle, setWritingMode, updateInputPanel } from './util'

const options = { clip: { x: 0, y: 0, width: 400, height: 400 }, threshold: 0.01 }

test('Control: positive margin', async ({ page }) => {
  await init(page)
  await setStyle(page, { Basic: { DefaultTheme: 'macOS 26' } })
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('positive-margin.png', options)
})

test('Control: zero border radius', async ({ page }) => {
  await init(page)
  await setStyle(page, { Size: { OverrideDefault: 'True', BorderRadius: '0', HighlightRadius: '8' } })
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('zero-border-radius.png', options)
})

test('Catppuccin theme', async ({ page }) => {
  await init(page)

  await setStyle(page, { DarkMode: { OverrideDefault: 'True', HighlightColor: '#b4befe' }, Highlight: { HoverBehavior: 'Add' }, Size: { OverrideDefault: 'True', Margin: '0', BorderRadius: '8', BorderWidth: '0', HighlightRadius: '8' }, Caret: { Style: 'Static' } })
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('normal.png', options)
  await hover(page, 2)
  await expect(page).toHaveScreenshot('hover.png', options)

  await setCandidates(page, [{}], 0)
  await expect(page).toHaveScreenshot('single.png', options)

  await updateInputPanel(page, 'preedit')
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('preedit.png', options)
  await updateInputPanel(page, '')

  await setCandidates(page, [{}, {}, {}], 2, true)
  await expect(page).toHaveScreenshot('horizontal-paging.png', options)

  await setLayout(page, VERTICAL)
  await setCandidates(page, [{}, {}, {}], 2, true, true)
  await expect(page).toHaveScreenshot('vertical-paging.png', options)

  await setLayout(page, HORIZONTAL)
  await setWritingMode(page, VERTICAL_RL)
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('vertical-rl.png', options)

  await setWritingMode(page, VERTICAL_LR)
  await setCandidates(page, [{}, {}, {}], 0)
  await expect(page).toHaveScreenshot('vertical-lr.png', options)
})
