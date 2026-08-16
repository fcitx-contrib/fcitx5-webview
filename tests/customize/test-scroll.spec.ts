import { expect, test } from '@playwright/test'
import { candidate, getBox, getCppCalls, init, panel, scrollExpand, scrollReady, setStyle } from '../util'

test('Row, column and cell width', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxRowCount: '2', MaxColumnCount: '3' },
    Size: { OverrideDefault: 'True', ScrollCellWidth: '50' },
  })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  const pane = panel(page)
  await expect(pane).toHaveCSS('width', '160px')
  await expect(pane).toHaveCSS('height', '60px')
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '10' },
  })
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
  await expect(candidate(page, 10).locator('.fcitx-label')).toHaveText('0')

  await page.evaluate(() => {
    window.fcitx.scrollKeyAction(0)
    window.fcitx.scrollKeyAction(1)
  })
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => 'select' in call)).toEqual([{ select: [9] }, { select: [0] }])
})

test('Hide scrollbar', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { ShowScrollBar: 'False' },
  })
  await scrollExpand(page, Array.from({ length: 42 }).map((_, i) => (i + 1).toString()))
  const pane = panel(page)
  await expect(pane).toHaveCSS('width', '390px')
})

test('Dynamic candidate count in collapsed horizontal mode', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  await scrollReady(page, Array.from({ length: 7 }).map(() => ({ text: '短' })), 0, true)

  await expect(panel(page)).toHaveCSS('width', '400px')
  await expect(page.locator('.fcitx-expand')).toBeVisible()
  await expect(page.locator('.fcitx-candidate:visible')).toHaveCount(5)
})

test('Dynamic candidate count selects only visible candidates', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  await scrollReady(page, Array.from({ length: 7 }).map(() => ({ text: '短' })), 0, true)

  await page.evaluate(() => window.fcitx.scrollKeyAction(6))
  expect((await getCppCalls(page)).filter(call => 'select' in call)).toEqual([])

  await page.evaluate(() => window.fcitx.scrollKeyAction(4))
  expect((await getCppCalls(page)).filter(call => 'select' in call)).toEqual([{ select: [3] }])
})

test('Dynamic candidate count can be enabled without scroll state', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  const cands = Array.from({ length: 7 }).map(() => ({ text: '短', label: '', comment: '', actions: [], spaceBetweenComment: true }))
  await page.evaluate(({ cands }) => window.fcitx.setCandidates(cands, 0, false, false, false, 0, false, false, true), { cands })
  await expect(page.locator('.fcitx-candidate:visible')).toHaveCount(6)
})

test('Dynamic candidate count can be disabled', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  await scrollReady(page, Array.from({ length: 7 }).map(() => ({ text: '短' })), 0, true)
  await expect(page.locator('.fcitx-candidate:visible')).toHaveCount(5)

  await setStyle(page, {
    ScrollMode: { DynamicCandidateCount: 'False' },
  })
  await expect(page.locator('.fcitx-expand')).toBeVisible()
  await expect(page.locator('.fcitx-candidate:visible')).toHaveCount(7)

  await setStyle(page, {
    ScrollMode: { DynamicCandidateCount: 'True' },
  })
  await expect(page.locator('.fcitx-candidate:visible')).toHaveCount(5)
})

test('Dynamic first row matches scroll candidate cells', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    Font: { LabelFontSize: '24', TextFontSize: '40' },
    ScrollMode: { MaxColumnCount: '6' },
    Size: { OverrideDefault: 'True', ScrollCellWidth: '130' },
  })
  const cands = [
    { label: '1', text: '动态码', comment: '', actions: [], spaceBetweenComment: true },
    { label: '2', text: '动态漫', comment: '', actions: [], spaceBetweenComment: true },
    { label: '3', text: '动态美', comment: '', actions: [], spaceBetweenComment: true },
    { label: '4', text: '动态嗨', comment: '', actions: [], spaceBetweenComment: true },
  ]
  await page.evaluate(({ cands }) => window.fcitx.setCandidates(cands, 0, false, false, false, 1, false, false, true), { cands })
  const dynamicCandidate = await getBox(candidate(page, 0))
  const dynamicInner = await getBox(candidate(page, 0).locator('.fcitx-candidate-inner'))

  await page.evaluate(({ cands }) => window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, false), { cands })
  const scrollCandidate = await getBox(candidate(page, 0))
  const scrollInner = await getBox(candidate(page, 0).locator('.fcitx-candidate-inner'))

  expect(dynamicCandidate.width).toBe(scrollCandidate.width)
  expect(dynamicCandidate.height).toBe(scrollCandidate.height)
  expect(dynamicInner.width).toBe(scrollInner.width)
  expect(dynamicInner.height).toBe(scrollInner.height)
})

test('Expand with initial highlight preserves selection', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  const texts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  await scrollExpand(page, texts, 2)
  await expect(candidate(page, 2)).toContainClass('fcitx-highlighted')
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"highlight":[2]}').length).toBeGreaterThanOrEqual(1)
})

test('Navigate down a row with DOWN and collapse on top row with UP', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { MaxColumnCount: '6' },
  })
  const texts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  await scrollExpand(page, texts, 1)
  await expect(candidate(page, 1)).toContainClass('fcitx-highlighted')

  // Move down to next row
  await page.evaluate(() => window.fcitx.scrollKeyAction(11)) // DOWN = 11
  await expect(candidate(page, 7)).toContainClass('fcitx-highlighted')

  // Move back up to top row
  await page.evaluate(() => window.fcitx.scrollKeyAction(10)) // UP = 10
  await expect(candidate(page, 1)).toContainClass('fcitx-highlighted')

  // Pressing UP on top row triggers collapse
  await page.evaluate(() => window.fcitx.scrollKeyAction(10)) // UP = 10
  // Wait for collapse timeout
  await page.waitForTimeout(350)
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"scroll":[-1,0]}').length).toEqual(1)
})
