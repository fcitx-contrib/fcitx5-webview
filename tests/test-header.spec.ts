import { expect, test } from '@playwright/test'
import { followHostTheme, getBox, getTextBox, init, panel, updateInputPanel } from './util'

test('Square when single character auxUp for macOS 15', async ({ page }) => {
  await init(page)
  await followHostTheme(page, 'macOS', 15)
  const pane = panel(page)
  const side = 32

  await updateInputPanel(page, '', 'A', '')
  await expect(pane).toHaveText('A')
  let box = await getBox(pane)
  expect(box.width).toEqual(side)
  expect(box.height).toEqual(side)

  await updateInputPanel(page, '', '拼', '')
  await expect(pane).toHaveText('拼')
  box = await getBox(pane)
  expect(box.width).toEqual(side)
  expect(box.height).toEqual(side)
})

test('No text shift when preedit grows', async ({ page }) => {
  await init(page)
  const preedit = panel(page).locator('.fcitx-preedit')

  await updateInputPanel(page, 'c', '', '')
  const cBox = await getTextBox(preedit, 0)
  await updateInputPanel(page, 'ce', '', '')
  const ceBox = await getTextBox(preedit, 0)
  expect(ceBox).toEqual(cBox)
})
