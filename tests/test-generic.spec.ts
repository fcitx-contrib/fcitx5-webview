import {
  expect,
  test,
} from '@playwright/test'
import { HORIZONTAL, VERTICAL } from '../page/constant'
import {
  candidate,
  getBox,
  getCppCalls,
  init,
  panel,
  setCandidates,
  setLayout,
  theme,
} from './util'

test('HTML structure', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.querySelector('#fcitx-theme')?.classList.remove('fcitx-macos')
  })
  await setCandidates(page, [
    { text: '页面结构', label: '1', comment: 'c', actions: [] },
    { text: '测试', label: '2', comment: '', actions: [] },
  ], 0)

  const actual = (await theme(page).evaluate(el => el.outerHTML)).replaceAll(/>\s+</g, '><').replaceAll(/ class="([^"]+)"/g, (_, classes) => ` class="${classes.split(' ').sort().join(' ')}"`)
  const expected = `
<div id="fcitx-theme" class="fcitx-basic fcitx-blue fcitx-dark">
  <div class="fcitx-decoration">
    <div class="fcitx-panel-topleft"></div>
    <div class="fcitx-panel-top"></div>
    <div class="fcitx-panel-topright"></div>
    <div class="fcitx-panel-left"></div>
    <div class="fcitx-panel-center">
      <div class="fcitx-horizontal-tb fcitx-panel">
        <div class="fcitx-panel-blur">
          <div class="fcitx-header">
            <div class="fcitx-aux-up fcitx-hidden"></div>
            <div class="fcitx-hidden fcitx-preedit"></div>
          </div>
          <div class="fcitx-aux-down fcitx-hidden"></div>
          <div class="fcitx-horizontal fcitx-hoverables fcitx-no-margin">
            <div class="fcitx-candidate fcitx-candidate-first fcitx-highlighted fcitx-highlighted-original fcitx-hoverable">
              <div class="fcitx-candidate-inner fcitx-hoverable-inner">
                <div class="fcitx-mark fcitx-no-text"></div>
                <div class="fcitx-label">1</div>
                <div class="fcitx-text">页面结构</div>
                <div class="fcitx-comment">c</div>
              </div>
            </div>
            <div class="fcitx-divider">
              <div class="fcitx-divider-side"></div>
              <div class="fcitx-divider-middle"></div>
              <div class="fcitx-divider-side"></div>
            </div>
            <div class="fcitx-candidate fcitx-candidate-last fcitx-hoverable">
              <div class="fcitx-candidate-inner fcitx-hoverable-inner">
                <div class="fcitx-label">2</div>
                <div class="fcitx-text">测试</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="fcitx-panel-right"></div>
    <div class="fcitx-panel-bottomleft"></div>
    <div class="fcitx-panel-bottom"></div>
    <div class="fcitx-panel-bottomright"></div>
  </div>
  <div class="fcitx-contextmenu" style="display: none;"></div>
</div>
`.replaceAll(/\n */g, '')
  expect(actual).toEqual(expected)
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '点击', label: '1', comment: '', actions: [] },
    { text: '候选词', label: '2', comment: '', actions: [] },
  ], 0)

  await candidate(page, 1).click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toHaveLength(2)
  expect(cppCalls[0]).toHaveProperty('resize') // ResizeObserver
  expect(cppCalls[1]).toEqual({ select: 1 })
})

test('Candidate action', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '可遗忘', label: '1', comment: '', actions: [{ id: 1, text: '忘记' }] },
  ], 0)

  await candidate(page, 0).click({ button: 'right' })
  await page.getByText('忘记').click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls[cppCalls.length - 1]).toEqual({ action: [0, 1] })
})

test('Drag should not select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '拖动', label: '1', comment: '', actions: [] },
    { text: '不选词', label: '2', comment: '', actions: [] },
  ], 0)

  const box = await getBox(candidate(page, 0))
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX, centerY + 10)
  await page.mouse.up()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toHaveLength(2)
  expect(cppCalls[0]).toHaveProperty('resize') // ResizeObserver
  expect(cppCalls[1]).toHaveProperty('resize') // drag
})

test('But micro drag is tolerated', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '微动', label: '1', comment: '', actions: [] },
    { text: '选词', label: '2', comment: '', actions: [] },
  ], 0)

  const box = await getBox(candidate(page, 0))
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX, centerY + 1)
  await page.mouse.up()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls).toHaveLength(3)
  expect(cppCalls[0]).toHaveProperty('resize') // ResizeObserver
  expect(cppCalls[1]).toHaveProperty('resize') // drag
  expect(cppCalls[2]).toEqual({ select: 0 })
})

test('Set layout', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '横', label: '1', comment: '', actions: [] },
    { text: '竖', label: '1', comment: '', actions: [] },
    { text: '分', label: '1', comment: '', actions: [] },
    { text: '明', label: '1', comment: '', actions: [] },
  ], 0)

  await setLayout(page, VERTICAL)
  const verticalBox = await getBox(panel(page))
  expect(verticalBox).toMatchObject({
    x: 25,
    y: 39, // shadow and inline-grid
  })
  expect(verticalBox.width).toBeGreaterThan(197)
  expect(verticalBox.width).toBeLessThan(207)
  expect(verticalBox.height).toBeGreaterThan(120)
  expect(verticalBox.height).toBeLessThan(130)

  await setLayout(page, HORIZONTAL)
  const horizontalBox = await getBox(panel(page))
  expect(horizontalBox).toMatchObject({
    x: 25,
    y: 39,
  })
  expect(horizontalBox.width).toBeGreaterThan(170)
  expect(horizontalBox.width).toBeLessThan(186)
  expect(horizontalBox.height).toBeGreaterThan(27)
  expect(horizontalBox.height).toBeLessThan(37)
})
