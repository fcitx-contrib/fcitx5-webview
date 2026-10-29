import { expect, test } from '@playwright/test'
import { RIGHT } from '../page/constant'
import { candidate, init, scrollExpand, setCandidates, setStyle, theme } from './util'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
})

test('Initial and repeated themes do not enable color transitions', async ({ page }) => {
  await page.clock.pauseAt(Date.now())
  await init(page)
  await setCandidates(page, [{}], 0)
  const text = candidate(page, 0).locator('.fcitx-text')
  await expect(text).toHaveCSS('transition-duration', '0s, 0s, 0s')
  await page.evaluate(() => window.fcitx.setTheme(2))
  await expect(text).toHaveCSS('transition-duration', '0s, 0s, 0s')

  await page.evaluate(() => window.fcitx.setTheme(1))
  await expect(text).toHaveCSS('transition-duration', '0.5s, 0.5s, 0.5s')
  await page.clock.runFor(300)
  await page.evaluate(() => window.fcitx.setTheme(1))
  await page.clock.runFor(200)
  await expect(text).toHaveCSS('transition-duration', '0s, 0s, 0s')
})

test('Reduced motion disables color transitions and responds to preference changes', async ({ page }) => {
  await page.clock.pauseAt(Date.now())
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await init(page)
  await setCandidates(page, [{}, {}], 0)
  const text = candidate(page, 1).locator('.fcitx-text')

  await page.evaluate(() => window.fcitx.setTheme(1))
  await expect(text).toHaveCSS('transition-duration', '0s')
  expect(await theme(page).evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(text).toHaveCSS('transition-duration', '0.5s, 0.5s, 0.5s')
  const transitions = await text.evaluate((element) => {
    getComputedStyle(element).getPropertyValue('color')
    window.fcitx.setTheme(2)
    getComputedStyle(element).getPropertyValue('color')
    return element.getAnimations()
      .filter(animation => animation instanceof CSSTransition)
      .map(animation => animation.transitionProperty)
  })
  expect(transitions).toContain('color')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(text).toHaveCSS('transition-duration', '0s')
  expect(await theme(page).evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
})

test('Rapid theme changes cancel the previous cleanup timer', async ({ page }) => {
  await page.clock.pauseAt(Date.now())
  await init(page)
  await page.evaluate(() => window.fcitx.setTheme(1))
  await page.clock.runFor(300)
  await page.evaluate(() => window.fcitx.setTheme(2))
  await page.clock.runFor(200)
  await expect(theme(page)).toHaveCSS('--color-transition-duration', '500ms')
  await page.clock.runFor(300)
  await expect(theme(page)).toHaveCSS('--color-transition-duration', '')
})

test('System theme changes animate only when following the system', async ({ page }) => {
  await page.clock.pauseAt(Date.now())
  await init(page)
  await page.evaluate(() => window.fcitx.setTheme(0))
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(theme(page)).toContainClass('fcitx-light')
  await expect(theme(page)).toHaveCSS('--color-transition-duration', '500ms')
  await page.clock.runFor(500)

  await page.evaluate(() => window.fcitx.setTheme(1))
  await page.emulateMedia({ colorScheme: 'dark' })
  // Wait for the media query event even though the fixed theme does not change.
  await page.clock.runFor(20)
  await expect(theme(page)).toContainClass('fcitx-light')
  await expect(theme(page)).toHaveCSS('--color-transition-duration', '')
  await page.evaluate(() => window.fcitx.setTheme(0))
  await expect(theme(page)).toContainClass('fcitx-dark')
})

test('Theme changes animate highlight, mark, comments and borders', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    Highlight: { MarkStyle: 'Bar' },
    ScrollMode: { Animation: 'False' },
    DarkMode: {
      OverrideDefault: 'True',
      HighlightColor: '#0000ff',
      HighlightMarkColor: '#00ff00',
      HighlightCommentColor: '#ff0000',
      CommentColor: '#00ffff',
      BorderColor: '#000000',
      DividerColor: '#000000',
    },
    LightMode: {
      OverrideDefault: 'True',
      HighlightColor: '#ff0000',
      HighlightMarkColor: '#ff00ff',
      HighlightCommentColor: '#00ff00',
      CommentColor: '#ffff00',
      BorderColor: '#ffffff',
      DividerColor: '#ffffff',
    },
  })
  await page.evaluate(() => {
    const cands = ['a', 'b'].map(text => ({
      text,
      label: '',
      comment: 'comment',
      actions: [],
      spaceBetweenComment: true,
    }))
    window.fcitx.setCandidates(cands, -1, false, false, false, 2, true, true, [
      { id: 1, text: 'tab', checked: true },
    ])
  })

  const cases = [
    ['.fcitx-candidate.fcitx-highlighted .fcitx-candidate-inner', 'background-color'],
    ['.fcitx-candidate.fcitx-highlighted .fcitx-mark', 'background-color'],
    ['.fcitx-candidate.fcitx-highlighted .fcitx-comment', 'color'],
    ['.fcitx-candidate:not(.fcitx-highlighted) .fcitx-comment', 'color'],
    ['.fcitx-panel', 'border-top-color'],
    ['.fcitx-tabs', 'border-top-color'],
    ['.fcitx-tab-inner', 'background-color'],
  ]
  const transitions = await page.evaluate((cases) => {
    // Resolve the old colors before changing the theme, then inspect actual CSS transitions.
    for (const [selector] of cases) {
      getComputedStyle(document.querySelector(selector)!).getPropertyValue('background-color')
    }
    window.fcitx.setTheme(1)
    return cases.map(([selector]) => {
      const element = document.querySelector(selector)!
      getComputedStyle(element).getPropertyValue('background-color')
      const animations = element.getAnimations().filter(animation => animation instanceof CSSTransition)
      return animations.map(animation => animation.transitionProperty)
    })
  }, cases)
  for (const [i, [selector, property]] of cases.entries()) {
    expect(transitions[i], selector).toContain(property)
  }
})

test('Color transitions work without macOS theme classes', async ({ page }) => {
  await init(page)
  await setCandidates(page, [{}], 0)
  await theme(page).evaluate(element => element.classList.remove('fcitx-macos', 'fcitx-macos-15', 'fcitx-macos-26'))
  await page.addStyleTag({
    content: `
      .fcitx-dark .fcitx-candidate-inner { background-color: blue; }
      .fcitx-light .fcitx-candidate-inner { background-color: red; }
    `,
  })
  const transitions = await page.evaluate(() => {
    const element = document.querySelector('.fcitx-candidate-inner')!
    getComputedStyle(element).getPropertyValue('background-color')
    window.fcitx.setTheme(1)
    getComputedStyle(element).getPropertyValue('background-color')
    return element.getAnimations()
      .filter(animation => animation instanceof CSSTransition)
      .map(animation => animation.transitionProperty)
  })
  expect(transitions).toContain('background-color')
})

test('Scroll highlight movement has no color transitions outside theme changes', async ({ page }) => {
  await init(page)
  await setStyle(page, {
    ScrollMode: { Animation: 'False' },
  })
  await scrollExpand(page, ['a', 'b', 'c'])
  await page.evaluate<void, SCROLL_KEY_ACTION>((action) => {
    getComputedStyle(document.querySelector('.fcitx-highlighted .fcitx-text')!).getPropertyValue('color')
    window.fcitx.scrollKeyAction(action)
  }, RIGHT)
  await expect(candidate(page, 1)).toContainClass('fcitx-highlighted')
  expect(await theme(page).evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)

  await page.evaluate(() => window.fcitx.setTheme(1))
  await page.evaluate<void, SCROLL_KEY_ACTION>(action => window.fcitx.scrollKeyAction(action), RIGHT)
  await expect(candidate(page, 2)).toContainClass('fcitx-highlighted')
  await expect(theme(page)).toHaveCSS('--color-transition-duration', '500ms')
})
