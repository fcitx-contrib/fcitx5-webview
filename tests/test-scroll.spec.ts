import test, { expect } from '@playwright/test'
import { candidate, getBox, getCppCalls, init, panel, scroll, scrollExpand, setStyle } from './util'

test('Actively expand', async ({ page }) => {
  await init(page)

  await page.evaluate(() =>
    window.fcitx.setCandidates([{ text: '1', label: '1', comment: '', actions: [] }], 0, '', true, false, true, 1, false, false))
  const pane = panel(page)
  await expect(pane).toHaveCSS('border-start-end-radius', '15px')
  await expect(pane).toHaveCSS('border-end-end-radius', '15px')

  await page.locator('.fcitx-expand').click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"scroll":[0,42]}').length, 'Highlight is set on expand').toEqual(1)
})

test('Passively expand', async ({ page }) => {
  await init(page)
  await scrollExpand(page, ['1', '2', '3', '4', '5', '6', '7'])
  const pane = panel(page)
  await expect(pane, 'Height of 2 rows').toHaveCSS('height', '60px')
  await expect(pane).toHaveCSS('width', '400px')
  await expect(candidate(page, 0)).toContainClass('fcitx-highlighted')
  const cppCalls = await getCppCalls(page)
  // Order of highlight and resize event is random.
  expect(cppCalls.filter(call => JSON.stringify(call) === '{"highlight":0}').length, 'Highlight is set on expand').toEqual(1)
})

test('Max height', async ({ page }) => {
  await init(page)
  await scrollExpand(page, Array.from({ length: 66 }).map((_, i) => (i + 1).toString()))
  const pane = panel(page)
  await expect(pane, 'Height of 6 rows').toHaveCSS('height', '180px')
  await expect(pane).toHaveCSS('width', '400px')

  await setStyle(page, { ScrollMode: { MaxRowCount: '10' } })
  await expect(pane, 'Height of 10 rows').toHaveCSS('height', '300px')

  await setStyle(page, { Size: { Margin: '4', TopPadding: '1', BottomPadding: '1' } })
  await expect(pane, 'Height of 6 rows with win11 theme').toHaveCSS('height', '204px')

  await setStyle(page, { Font: { TextFontSize: '32' } })
  await expect(pane, 'Height of 6 rows with big font size').toHaveCSS('height', '228px')
})

test('Grid alignment', async ({ page }) => {
  await init(page)
  // 011122
  // 34
  // The sum of original width of the first 4 candidates is less than 392px,
  // but the 4th candidate goes to the next row.
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .fcitx-candidate:nth-child(1) {
        width: 50px;
      }
      .fcitx-candidate:nth-child(3) {
        width: 150px;
      }
      .fcitx-candidate:nth-child(5) {
        width: 100px;
      }
      .fcitx-candidate:nth-child(7) {
        width: 50px;
      }
      .fcitx-candidate:nth-child(9) {
        width: 50px;
      }
    `
    document.head.append(style)
  })
  const texts = ['1', '2', '3', '4', '5']
  await scrollExpand(page, texts)
  const boxes = await Promise.all(texts.map((_, i) => getBox(candidate(page, i))))
  for (const box of boxes) {
    expect(box.height).toEqual(30)
  }

  expect(boxes[0].width).toEqual(65)
  expect(boxes[1].width).toEqual(195)
  expect(boxes[2].width).toEqual(130)
  expect(boxes[3].width).toEqual(65)
  expect(boxes[4].width).toEqual(65)

  expect(boxes[0].y).toEqual(boxes[1].y)
  expect(boxes[1].y).toEqual(boxes[2].y)
  expect(boxes[2].y + boxes[2].height).toEqual(boxes[3].y)
  expect(boxes[3].y).toEqual(boxes[4].y)

  expect(boxes[0].x + boxes[0].width).toEqual(boxes[1].x)
  expect(boxes[1].x + boxes[1].width).toEqual(boxes[2].x)
  expect(boxes[3].x).toEqual(boxes[0].x)
  expect(boxes[4].x).toEqual(boxes[1].x)
})

test('Long candidate', async ({ page }) => {
  await init(page)

  await scrollExpand(page, ['长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长', '短', '短'])
  const longBox = await getBox(candidate(page, 0))
  const shortBox = await getBox(candidate(page, 2))
  expect(longBox.width).toEqual(390)
  expect(longBox.height).toBeGreaterThan(shortBox.height)
  expect(shortBox.width).toEqual(65)
})

test('No enough space in current row', async ({ page }) => {
  await init(page)

  // 00011
  // 22
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .fcitx-candidate:nth-child(1) {
        width: 180px;
      }
      .fcitx-candidate:nth-child(3) {
        width: 120px;
      }
      .fcitx-candidate:nth-child(5) {
        width: 120px;
      }
    `
    document.head.append(style)
  })
  await scrollExpand(page, ['1', '2', '3'])
  const firstBox = await getBox(candidate(page, 0))
  const thirdBox = await getBox(candidate(page, 2))
  expect(firstBox.x).toEqual(thirdBox.x)
  expect(firstBox.y + firstBox.height).toEqual(thirdBox.y)

  const lastDividerBoxInFirstRow = await getBox(page.locator('.fcitx-divider:nth-child(4)'))
  expect(lastDividerBoxInFirstRow.width, 'No gap in the first row').toBeGreaterThan(65)
})

test('Fill rest space temporarily and shrink when more candidates come', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .fcitx-candidate:nth-child(1) {
        width: 300px;
      }
    `
    document.head.append(style)
  })

  await scrollExpand(page, ['1', '2', '3'])
  const thirdDivider = page.locator('.fcitx-divider:nth-child(6)')
  expect((await getBox(thirdDivider)).width).toBeGreaterThanOrEqual(327) // May have scrollbar.

  await scroll(page, ['4'], true)
  const forthDivider = page.locator('.fcitx-divider:nth-child(8)')
  expect((await getBox(forthDivider)).width).toBeGreaterThanOrEqual(262)
  expect((await getBox(thirdDivider)).width).toEqual(0)
})
