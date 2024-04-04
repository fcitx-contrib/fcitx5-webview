import {
  test,
  expect
} from '@playwright/test'
import {
  setCandidates,
  setLayout,
  panel,
  candidate,
  getBox,
  getCppCalls,
  init
} from './util'

test('HTML structure', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.querySelector('.panel')?.classList.remove('macos')
    for (const klass of ['.panel-blur-outer', '.panel-blur-inner']) {
      document.querySelector(klass)?.classList.remove('blur')
    }
  })
  await setCandidates(page, ['页面结构', '测试'], ['1', '2'], ['c', ''], 0)

  const actual = (await panel(page).evaluate(el => el.outerHTML)).replaceAll(/>\s+</g, '><')
    .replaceAll(/ class="([^"]+)"/g, (_, classes) => ` class="${classes.split(' ').sort().join(' ')}"`)
  const expected = `
<div class="basic blue dark panel">
  <div class="panel-blur-outer">
    <div class="panel-blur-inner">
      <div class="header">
        <div class="aux-up hidden"></div>
        <div class="hidden preedit"></div>
      </div>
      <div class="aux-down hidden"></div>
      <div class="hoverables">
        <div class="candidate candidate-first highlighted highlighted-original hoverable">
          <div class="candidate-inner hoverable-inner">
            <div class="mark no-text"></div>
            <div class="label">1</div>
            <div class="text">页面结构</div>
            <div class="comment">c</div>
          </div>
        </div>
        <div class="divider">
          <div class="divider-side"></div>
          <div class="divider-middle"></div>
          <div class="divider-side"></div>
        </div>
        <div class="candidate candidate-last hoverable">
          <div class="candidate-inner hoverable-inner">
            <div class="label">2</div>
            <div class="text">测试</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`.replaceAll(/\n */g, '')
  expect(actual).toEqual(expected)
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, ['点击', '候选词'], ['1', '2'], ['', ''], 0)

  await candidate(page, 1).click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toEqual([{ select: 1 }])
})

test('Drag should not select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, ['拖动', '不选词'], ['1', '2'], ['', ''], 0)

  const box = await getBox(candidate(page, 0))
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX, centerY + 10)
  await page.mouse.up()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toHaveLength(1)
  expect(cppCalls[0]).toHaveProperty('resize')
})

test('Set layout', async ({ page }) => {
  await init(page)
  await setCandidates(page, ['横', '竖', '分', '明'], ['1', '2', '3', '4'], ['', '', '', ''], 0)

  await setLayout(page, 1)
  const verticalBox = await getBox(panel(page))
  expect(verticalBox).toMatchObject({
    x: 25, y: 25 // shadow
  })
  expect(verticalBox.width).toBeGreaterThan(41)
  expect(verticalBox.width).toBeLessThan(51)
  expect(verticalBox.height).toBeGreaterThan(120)
  expect(verticalBox.height).toBeLessThan(130)

  await setLayout(page, 0)
  const horizontalBox = await getBox(panel(page))
  expect(horizontalBox).toMatchObject({
    x: 25, y: 25
  })
  expect(horizontalBox.width).toBeGreaterThan(170)
  expect(horizontalBox.width).toBeLessThan(186)
  expect(horizontalBox.height).toBeGreaterThan(27)
  expect(horizontalBox.height).toBeLessThan(37)
})
