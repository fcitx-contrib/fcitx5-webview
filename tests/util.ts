import type {
  Locator,
  Page,
} from '@playwright/test'
import { dirname, join } from 'node:path'

export async function init(page: Page) {
  const url = `file://${join(dirname(import.meta.url), '..', 'dist', 'index.html').substring('file:'.length)}`
  await page.goto(url)
  await page.evaluate(() => {
    window.fcitx.setTheme(2)
    window.cppCalls = []
    window.fcitx._resize = (call_id: number, dx: number, dy: number, anchorTop: number, anchorRight: number, anchorBottom: number, anchorLeft: number, panelTop: number, panelRight: number, panelBottom: number, panelLeft: number, panelRadius: number, fullWidth: number, fullHeight: number, dragging: boolean) => {
      window.cppCalls.push({
        resize: [dx, dy, anchorTop, anchorRight, anchorBottom, anchorLeft, panelTop, panelRight, panelBottom, panelLeft, panelRadius, fullWidth, fullHeight, dragging],
      })
    }
    window.fcitx._select = (index: number) => {
      window.cppCalls.push({
        select: index,
      })
    }
    window.fcitx._action = (index: number, id: number) => {
      window.cppCalls.push({
        action: [index, id],
      })
    }
    window.fcitx._log = () => {}
  })
}

export function setCandidates(page: Page, cands: Candidate[], highlighted: number) {
  return page.evaluate(({ cands, highlighted }) =>
    window.fcitx.setCandidates(cands, highlighted, '', false, false, false, 0, false, false), { cands, highlighted })
}

export function setLayout(page: Page, layout: 0 | 1) {
  return page.evaluate(({ layout }) =>
    window.fcitx.setLayout(layout), { layout })
}

export function theme(page: Page) {
  return page.locator('#fcitx-theme')
}

export function panel(page: Page) {
  return page.locator('.fcitx-panel')
}

export function candidate(page: Page, index: number) {
  return panel(page).locator('.fcitx-candidate').nth(index)
}

export async function getBox(locator: Locator) {
  return (await locator.boundingBox())!
}

export function getCppCalls(page: Page) {
  return page.evaluate(() => window.cppCalls)
}
