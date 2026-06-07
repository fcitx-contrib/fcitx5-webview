/* eslint-disable import/no-mutable-exports */
export let theme: HTMLElement
export let decoration: HTMLElement
export let panel: HTMLElement
export let hoverables: HTMLElement
export let preedit: HTMLElement
export let auxUp: HTMLElement
export let auxDown: HTMLElement
export let contextmenu: HTMLElement

export function initSelectors(container: HTMLElement | Document = document) {
  theme = container.querySelector('#fcitx-theme') as HTMLElement
  decoration = container.querySelector('.fcitx-decoration') as HTMLElement
  panel = container.querySelector('.fcitx-panel')!
  hoverables = panel.querySelector('.fcitx-hoverables') as HTMLElement
  preedit = container.querySelector('.fcitx-preedit')!
  auxUp = container.querySelector('.fcitx-aux-up')!
  auxDown = container.querySelector('.fcitx-aux-down')!
  contextmenu = container.querySelector('.fcitx-contextmenu') as HTMLElement
}
