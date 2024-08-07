import {
  Page,
  Locator
} from '@playwright/test'
import { dirname, join } from 'path'

export async function init (page: Page) {
  const url = 'file://' + join(dirname(import.meta.url), '..', 'dist', 'index.html').substring('file:'.length)
  await page.goto(url)
  await page.evaluate(() => {
    window.setTheme(2)
    window.cppCalls = []
    window._resize = (dx: number, dy: number, anchorTop: number, anchorRight: number, anchorBottom: number, anchorLeft: number, fullWidth: number, fullHeight: number, dragging: boolean) => {
      window.cppCalls.push({
        resize: [dx, dy, anchorTop, anchorRight, anchorBottom, anchorLeft, fullWidth, fullHeight, dragging]
      })
    }
    window._select = (index: number) => {
      window.cppCalls.push({
        select: index
      })
    }
    window._action = (index: number, id: number) => {
      window.cppCalls.push({
        action: [index, id]
      })
    }
    window._log = () => {}
  })
}

export function setCandidates (page: Page, cands: Candidate[], highlighted: number) {
  return page.evaluate(({ cands, highlighted }) =>
    window.setCandidates(cands, highlighted, '', false, false, false, 0, false, false), { cands, highlighted })
}

export function setLayout (page: Page, layout: 0 | 1) {
  return page.evaluate(({ layout }) =>
    window.setLayout(layout), { layout })
}

export function theme (page: Page) {
  return page.locator('#fcitx-theme')
}

export function panel (page: Page) {
  return page.locator('.fcitx-panel')
}

export function candidate (page: Page, index: number) {
  return panel(page).locator('.fcitx-candidate').nth(index)
}

export async function getBox (locator: Locator) {
  return (await locator.boundingBox())!
}

export function getCppCalls (page: Page) {
  return page.evaluate(() => window.cppCalls)
}
