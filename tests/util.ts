import {
  Page,
  Locator
} from '@playwright/test'
import { dirname, join } from 'path'

export async function init (page: Page) {
  const url = 'file://' + join(dirname(import.meta.url), '..', 'dist', 'index.html').substring('file:'.length)
  await page.goto(url)
  await page.evaluate(() => {
    window.cppCalls = []
    window._resize = (x: number, y: number, width: number, height: number) => {
      window.cppCalls.push({
        resize: [x, y, width, height]
      })
    }
    window._select = (index: number) => {
      window.cppCalls.push({
        select: index
      })
    }
  })
}

export function setCandidates (page: Page, cands: string[], labels: string[], highlighted: number) {
  return page.evaluate(({ cands, labels, highlighted }) =>
    window.setCandidates(cands, labels, highlighted), { cands, labels, highlighted })
}

export function setLayout (page: Page, layout: 0 | 1) {
  return page.evaluate(({ layout }) =>
    window.setLayout(layout), { layout })
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
