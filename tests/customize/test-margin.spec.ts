import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { VERTICAL } from '../../page/constant'
import { candidate, getBox, init, scrollExpand, setCandidates, setLayout, setStyle } from '../util'

const candidates = [
  { text: 'a', label: '', comment: '', actions: [] },
  { text: 'b', label: '', comment: '', actions: [] },
  { text: 'c', label: '', comment: '', actions: [] },
]
const margin = 2
const border = 1

async function getAllBoxes(page: Page) {
  const candidates = await page.locator('.fcitx-candidate').all()
  const array = await Promise.all(candidates.map(async (c) => {
    const box = await getBox(c)
    const innerBox = await getBox(c.locator('.fcitx-candidate-inner'))
    return [box, innerBox]
  }))
  return array.flatMap(x => x)
}

test('Horizontal margin collapse', async ({ page }) => {
  await init(page)
  await setStyle(page, { Size: { Margin: margin.toString(), HighlightRadius: '4' } })
  await setCandidates(page, candidates, 0)
  const [firstBox, firstInnerBox, secondBox, secondInnerBox, thirdBox, thirdInnerBox] = await getAllBoxes(page)

  expect(firstBox.x + firstBox.width).toEqual(secondBox.x)
  expect(secondBox.x + secondBox.width).toEqual(thirdBox.x)
  expect(firstBox.y).toEqual(secondBox.y)
  expect(secondBox.y).toEqual(thirdBox.y)
  expect(firstBox.height).toEqual(secondBox.height)
  expect(secondBox.height).toEqual(thirdBox.height)

  expect(firstInnerBox.x).toEqual(firstBox.x + margin)
  expect(firstInnerBox.y).toEqual(firstBox.y + margin)
  expect(firstInnerBox.width).toEqual(firstBox.width - margin * 1.5)
  expect(firstInnerBox.height).toEqual(firstBox.height - margin * 2)

  expect(secondInnerBox.x).toEqual(secondBox.x + margin * 0.5)
  expect(secondInnerBox.y).toEqual(secondBox.y + margin)
  expect(secondInnerBox.width).toEqual(secondBox.width - margin)
  expect(secondInnerBox.height).toEqual(secondBox.height - margin * 2)

  expect(thirdInnerBox.x).toEqual(thirdBox.x + margin * 0.5)
  expect(thirdInnerBox.y).toEqual(thirdBox.y + margin)
  expect(thirdInnerBox.width).toEqual(thirdBox.width - margin * 1.5)
  expect(thirdInnerBox.height).toEqual(thirdBox.height - margin * 2)
})

test('Scroll corner', async ({ page }) => {
  await init(page)
  const margin = 2
  await setStyle(page, { Size: { Margin: margin.toString(), HighlightRadius: '4' } })
  await scrollExpand(page, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])

  const first = candidate(page, 0)
  const firstBox = await getBox(first)
  const firstInnerBox = await getBox(first.locator('.fcitx-candidate-inner'))
  expect(firstInnerBox.x).toEqual(firstBox.x + margin)
  expect(firstInnerBox.y).toEqual(firstBox.y + margin)

  const sixth = candidate(page, 5)
  const sixthBox = await getBox(sixth)
  const sixthInnerBox = await getBox(sixth.locator('.fcitx-candidate-inner'))
  expect(sixthInnerBox.x + sixthInnerBox.width).toEqual(sixthBox.x + sixthBox.width - margin)
  expect(sixthInnerBox.y).toEqual(sixthBox.y + margin)

  const last = candidate(page, 6)
  const lastBox = await getBox(last)
  const lastInnerBox = await getBox(last.locator('.fcitx-candidate-inner'))
  expect(lastInnerBox.x).toEqual(lastBox.x + margin)
  expect(lastInnerBox.y + lastInnerBox.height).toEqual(lastBox.y + lastBox.height - margin)
})

test('Vertical no margin collapse with divider', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setStyle(page, { Size: { Margin: margin.toString(), HighlightRadius: '4' } })
  await setCandidates(page, candidates, 0)

  const [firstBox, firstInnerBox, secondBox, secondInnerBox, thirdBox, thirdInnerBox] = await getAllBoxes(page)
  expect(firstBox.x).toEqual(secondBox.x)
  expect(secondBox.x).toEqual(thirdBox.x)
  expect(firstBox.y + firstBox.height + border).toEqual(secondBox.y)
  expect(secondBox.y + secondBox.height + border).toEqual(thirdBox.y)

  expect(firstInnerBox.x).toEqual(firstBox.x + margin)
  expect(firstInnerBox.y).toEqual(firstBox.y + margin)
  expect(firstInnerBox.width).toEqual(firstBox.width - margin * 2)
  expect(firstInnerBox.height).toEqual(firstBox.height - margin * 2)

  expect(secondInnerBox.x).toEqual(secondBox.x + margin)
  expect(secondInnerBox.y).toEqual(secondBox.y + margin)
  expect(secondInnerBox.width).toEqual(secondBox.width - margin * 2)
  expect(secondInnerBox.height).toEqual(secondBox.height - margin * 2)

  expect(thirdInnerBox.x).toEqual(thirdBox.x + margin)
  expect(thirdInnerBox.y).toEqual(thirdBox.y + margin)
  expect(thirdInnerBox.width).toEqual(thirdBox.width - margin * 2)
  expect(thirdInnerBox.height).toEqual(thirdBox.height - margin * 2)
})

test('Vertical margin collapse with no divider', async ({ page }) => {
  await init(page)
  await setLayout(page, VERTICAL)
  await setStyle(page, { Size: { HorizontalDividerWidth: '0', Margin: margin.toString(), HighlightRadius: '4' } })
  await setCandidates(page, candidates, 0)

  const [firstBox, firstInnerBox, secondBox, secondInnerBox, thirdBox, thirdInnerBox] = await getAllBoxes(page)
  expect(firstBox.x).toEqual(secondBox.x)
  expect(secondBox.x).toEqual(thirdBox.x)
  expect(firstBox.y + firstBox.height).toEqual(secondBox.y)
  expect(secondBox.y + secondBox.height).toEqual(thirdBox.y)

  expect(firstInnerBox.x).toEqual(firstBox.x + margin)
  expect(firstInnerBox.y).toEqual(firstBox.y + margin)
  expect(firstInnerBox.width).toEqual(firstBox.width - margin * 2)
  expect(firstInnerBox.height).toEqual(firstBox.height - margin * 1.5)

  expect(secondInnerBox.x).toEqual(secondBox.x + margin)
  expect(secondInnerBox.y).toEqual(secondBox.y + margin * 0.5)
  expect(secondInnerBox.width).toEqual(secondBox.width - margin * 2)
  expect(secondInnerBox.height).toEqual(secondBox.height - margin)

  expect(thirdInnerBox.x).toEqual(thirdBox.x + margin)
  expect(thirdInnerBox.y).toEqual(thirdBox.y + margin * 0.5)
  expect(thirdInnerBox.width).toEqual(thirdBox.width - margin * 2)
  expect(thirdInnerBox.height).toEqual(thirdBox.height - margin * 1.5)
})
