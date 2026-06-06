export function initDistribution() {
  const distribution = window.fcitx?.distribution || ''

  if (distribution !== 'fcitx5-js') {
    /*
      Don't pollute page's style for f5j
      background: transparent, draw panel as you wish
      margin: default is 8px
      overflow: no scrollbar
      width, height: big enough, disregard window size
    */
    const style = document.createElement('style')
    style.innerHTML
      = `body {
  background: rgb(0 0 0 / 0%);
  margin: 0;
  overflow: hidden;
  width: 1920px;
  height: 1080px;
}`
    document.head.append(style)
    window.fcitx ||= ((...args: any[]) => console.log(...args)) as any // eslint-disable-line no-console
    window.fcitx.distribution = distribution
  }

  window.fcitx.host ||= { system: 'macOS', version: 26 }
  window.fcitx.setHost = (system: string, version: number) => {
    if (system) {
      window.fcitx.host = { system, version }
    }
  }
}
