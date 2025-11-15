import {
  expect,
  test,
} from '@playwright/test'
import { HORIZONTAL, VERTICAL } from '../page/constant'
import {
  candidate,
  followHostTheme,
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
  await setCandidates(page, [
    { text: '页面结构', label: '1', comment: 'c', actions: [] },
    { text: '测试', label: '2', comment: '', actions: [] },
  ], 0)

  const actual = (await theme(page).evaluate(el => el.outerHTML)).replaceAll(/>\s+</g, '><').replaceAll(/ class="([^"]+)"/g, (_, classes) => ` class="${classes.split(' ').sort().join(' ')}"`)
  const expected = `
<div id="fcitx-theme" class="fcitx-blue fcitx-dark fcitx-macos fcitx-macos-15 fcitx-macos-26">
  <div class="fcitx-decoration">
    <div class="fcitx-panel-topleft"></div>
    <div class="fcitx-panel-top"></div>
    <div class="fcitx-panel-topright"></div>
    <div class="fcitx-panel-left"></div>
    <div class="fcitx-panel-right"></div>
    <div class="fcitx-panel-bottomleft"></div>
    <div class="fcitx-panel-bottom"></div>
    <div class="fcitx-panel-bottomright"></div>
    <div class="fcitx-panel-center">
      <div class="fcitx-horizontal-tb fcitx-panel">
        <div class="fcitx-panel-blur">
          <div class="fcitx-header">
            <div class="fcitx-aux-up fcitx-hidden"></div>
            <div class="fcitx-hidden fcitx-preedit"></div>
          </div>
          <div class="fcitx-aux-down fcitx-hidden"></div>
          <div class="fcitx-horizontal fcitx-hoverables">
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
            <div class="fcitx-divider">
              <div class="fcitx-divider-side"></div>
              <div class="fcitx-divider-middle"></div>
              <div class="fcitx-divider-side"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fcitx-blur fcitx-contextmenu" style="display: none;"></div>
</div>
`.replaceAll(/\n */g, '')
  expect(actual).toEqual(expected)

  await followHostTheme(page, 'macOS', 15)
  expect((await theme(page).getAttribute('class'))!.split(' ').sort()).toEqual(['fcitx-blue', 'fcitx-dark', 'fcitx-macos', 'fcitx-macos-15'])
  await followHostTheme(page, 'macOS', 26)
  expect((await theme(page).getAttribute('class'))!.split(' ').sort()).toEqual(['fcitx-blue', 'fcitx-dark', 'fcitx-macos', 'fcitx-macos-26'])
})

test('Select candidate', async ({ page }) => {
  await init(page)
  await setCandidates(page, [
    { text: '点击', label: '1', comment: '', actions: [] },
    { text: '候选词', label: '2', comment: '', actions: [] },
  ], 0)

  await candidate(page, 1).click()
  const cppCalls = await getCppCalls(page)
  expect(cppCalls[0]).toHaveProperty('resize') // ResizeObserver
  expect(cppCalls[cppCalls.length - 1]).toEqual({ select: 1 })
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
  expect(cppCalls.every(call => 'resize' in call)).toBe(true)
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
  expect(cppCalls.filter(call => 'resize' in call).length).toBeGreaterThanOrEqual(2) // ResizeObserver and drag
  expect(cppCalls[cppCalls.length - 1]).toEqual({ select: 0 })
})

test.describe('Set layout', () => {
  const cases = [
    { system: 'macOS', version: 26, width: 257, height: 116 },
    { system: 'macOS', version: 15, width: 202, height: 125 },
  ]
  for (const { system, version, width, height } of cases) {
    test(`${system} ${version}`, async ({ page }) => {
      await init(page)
      await followHostTheme(page, system, version)

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
      expect(verticalBox.width).toEqual(width)
      expect(verticalBox.height).toEqual(height)

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
  }
})

test('WebKit prefix', async ({ page }) => {
  await init(page)

  const style = (await page.locator('style').first().textContent())!
  // macOS 26 uses WebKit 26, which doesn't support user-select.
  expect(style.includes('-webkit-user-select:none')).toBe(true)
  // macOS 13 uses WebKit 16, which doesn't support backdrop-filter.
  expect(style.includes('-webkit-backdrop-filter:var(--backdrop-filter,blur(16px))')).toBe(true)
})
