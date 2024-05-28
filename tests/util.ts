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
    window._resize = (dx: number, dy: number, shadowTop: number, shadowRight: number, shadowBottom: number, shadowLeft: number, fullWidth: number, fullHeight: number, enlargedWidth: number, enlargedHeight: number, dragging: boolean) => {
      window.cppCalls.push({
        resize: [dx, dy, shadowTop, shadowRight, shadowBottom, shadowLeft, fullWidth, fullHeight, enlargedWidth, enlargedHeight, dragging]
      })
    }
    window._select = (index: number) => {
      window.cppCalls.push({
        select: index
      })
    }
  })
}

export function setCandidates (page: Page, cands: Candidate[], highlighted: number) {
  return page.evaluate(({ cands, highlighted }) =>
    window.setCandidates(cands, highlighted, '', false, false, false), { cands, highlighted })
}

export function setLayout (page: Page, layout: 0 | 1) {
  return page.evaluate(({ layout }) =>
    window.setLayout(layout), { layout })
}

export function theme (page: Page) {
  return page.locator('#theme')
}

export function panel (page: Page) {
  return page.locator('.panel')
}

export function candidate (page: Page, index: number) {
  return panel(page).locator('.candidate').nth(index)
}

export async function getBox (locator: Locator) {
  return (await locator.boundingBox())!
}

export function getCppCalls (page: Page) {
  return page.evaluate(() => window.cppCalls)
}
