import { hoverables, panel } from './selector'
import { getHoverBehavior } from './ux'

const id = 'fcitx-ghost-stripe'

// Ghost stripe is reproducible for macOS 15 light theme when App background is dark,
// or catppuccin-mocha-lavender theme when App background is light.
// Key is Margin = 0 and BorderRadius >= HighlightRadius.
// It's a browser bug about anti-aliasing for long time so we can't wait for it to be fixed.
// Scroll mode is less affected but hard to fix given candidate positions are arbitrary so we give up.
// We also assume highlight color is opaque.
function getClipPath(candidate: HTMLElement, panelBox: DOMRect, panelStyle: CSSStyleDeclaration): string {
  const borderWidth = Number.parseFloat(panelStyle.borderWidth)
  const inner = candidate.querySelector('.fcitx-candidate-inner') as HTMLElement
  const innerBox = inner.getBoundingClientRect()
  const innerStyle = getComputedStyle(inner)
  const tl = innerBox.top <= panelBox.top + borderWidth && innerBox.left <= panelBox.left + borderWidth && Number.parseFloat(innerStyle.borderTopLeftRadius) <= Number.parseFloat(panelStyle.borderTopLeftRadius)
  const tr = innerBox.top <= panelBox.top + borderWidth && innerBox.right >= panelBox.right - borderWidth && Number.parseFloat(innerStyle.borderTopRightRadius) <= Number.parseFloat(panelStyle.borderTopRightRadius)
  const bl = innerBox.bottom >= panelBox.bottom - borderWidth && innerBox.left <= panelBox.left + borderWidth && Number.parseFloat(innerStyle.borderBottomLeftRadius) <= Number.parseFloat(panelStyle.borderBottomLeftRadius)
  const br = innerBox.bottom >= panelBox.bottom - borderWidth && innerBox.right >= panelBox.right - borderWidth && Number.parseFloat(innerStyle.borderBottomRightRadius) <= Number.parseFloat(panelStyle.borderBottomRightRadius)
  if (!tl && !tr && !bl && !br) {
    return ''
  }
  const path = []
  if (tl) {
    path.push(`0 ${panelStyle.borderTopLeftRadius}`, `${panelStyle.borderTopLeftRadius} 0`)
  }
  else {
    path.push(`0 0`, `0 0`)
  }
  if (tr) {
    path.push(`calc(100% - ${panelStyle.borderTopRightRadius}) 0`, `100% ${panelStyle.borderTopRightRadius}`)
  }
  else {
    path.push(`100% 0`, `100% 0`)
  }
  if (br) {
    path.push(`100% calc(100% - ${panelStyle.borderBottomRightRadius})`, `calc(100% - ${panelStyle.borderBottomRightRadius}) 100%`)
  }
  else {
    path.push(`100% 100%`, `100% 100%`)
  }
  if (bl) {
    path.push(`${panelStyle.borderBottomLeftRadius} 100%`, `0 calc(100% - ${panelStyle.borderBottomLeftRadius})`)
  }
  else {
    path.push(`0 100%`, `0 100%`)
  }
  return `polygon(${path.join(', ')})`
}

export function fixGhostStripe() {
  requestAnimationFrame(() => { // Necessary for catppuccin case with vertical + horizontal-tb with paging buttons.
    let style = document.head.querySelector(`#${id}`)
    do { // eslint-disable-line no-unreachable-loop
      if (hoverables.classList.contains('fcitx-horizontal-scroll')) {
        break
      }
      const candidates = hoverables.querySelectorAll('.fcitx-candidate') as NodeListOf<HTMLElement>
      if (candidates.length === 0) {
        break
      }
      const panelBox = panel.getBoundingClientRect()
      const panelStyle = getComputedStyle(panel)
      const firstClipPath = getClipPath(candidates[0], panelBox, panelStyle)
      const lastClipPath = candidates.length > 1 ? getClipPath(candidates[candidates.length - 1], panelBox, panelStyle) : ''
      if (!firstClipPath && !lastClipPath) {
        break
      }
      if (!style) {
        style = document.createElement('style')
        style.id = id
        document.head.appendChild(style)
      }
      let innerHTML = ''
      const hoverBehavior = getHoverBehavior()
      if (firstClipPath) {
        innerHTML += `.fcitx-candidate-first.fcitx-highlighted .fcitx-candidate-background { clip-path: ${firstClipPath}; }\n`
        if (hoverBehavior === 'Add') {
          innerHTML += `.fcitx-candidate-first:hover .fcitx-candidate-background { clip-path: ${firstClipPath}; }\n`
        }
      }
      if (lastClipPath) {
        innerHTML += `.fcitx-candidate-last.fcitx-highlighted .fcitx-candidate-background { clip-path: ${lastClipPath}; }\n`
        if (hoverBehavior === 'Add') {
          innerHTML += `.fcitx-candidate-last:hover .fcitx-candidate-background { clip-path: ${lastClipPath}; }\n`
        }
      }
      style.innerHTML = innerHTML
      return
    } while (false)

    style?.remove()
  })
}
