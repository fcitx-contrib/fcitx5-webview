import {
  test,
  expect
} from '@playwright/test'
import {
  setCandidates,
  setLayout,
  theme,
  panel,
  candidate,
  getBox,
  getCppCalls,
  init
} from './util'

test('HTML structure', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.querySelector('#theme')?.classList.remove('macos')
    for (const klass of ['.panel-blur-outer', '.panel-blur-inner']) {
      document.querySelector(klass)?.classList.remove('blur')
    }
  })
  await setCandidates(page, [
    { text: '页面结构', label: '1', comment: 'c', actions: [] },
    { text: '测试', label: '2', comment: '', actions: [] }], 0)

  const actual = (await theme(page).evaluate(el => el.outerHTML)).replaceAll(/>\s+</g, '><')
    .replaceAll(/ class="([^"]+)"/g, (_, classes) => ` class="${classes.split(' ').sort().join(' ')}"`)
  const expected = `
<div id="theme" class="basic blue dark">
  <div class="panel">
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
  <div class="contextmenu"></div>
</div>
`.replaceAll(/\n */g, '')
  expect(actual).toEqual(expected)
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '点击', label: '1', comment: '', actions: [] },
    { text: '候选词', label: '2', comment: '', actions: [] }], 0)

  await candidate(page, 1).click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toEqual([{ select: 1 }])
})

test('Candidate action', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '可遗忘', label: '1', comment: '', actions: [{ id: 1, text: '忘记' }] }], 0)

  await candidate(page, 0).click({ button: 'right' })
  await page.getByText('忘记').click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls[cppCalls.length - 1]).toEqual({ action: [0, 1] })
})

test('Drag should not select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '拖动', label: '1', comment: '', actions: [] },
    { text: '不选词', label: '2', comment: '', actions: [] }], 0)

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
  await setCandidates(page, [
    { text: '横', label: '1', comment: '', actions: [] },
    { text: '竖', label: '1', comment: '', actions: [] },
    { text: '分', label: '1', comment: '', actions: [] },
    { text: '明', label: '1', comment: '', actions: [] }], 0)

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
