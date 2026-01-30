export const distribution = <string>process.env.FCITX_DISTRIBUTION ?? '' // eslint-disable-line node/prefer-global/process

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

  if (window.fcitx === undefined) {
    // @ts-expect-error: for testing purpose
    window.fcitx = (...args: any[]) => console.log(...args) // eslint-disable-line no-console
  }
}

// window.fcitx is a function with properties, created by webview or f5j.
window.fcitx.distribution = distribution
window.fcitx.host = {
  system: 'macOS',
  version: 26,
}
window.fcitx.setHost = (system: string, version: number) => {
  if (system) {
    window.fcitx.host = { system, version }
  }
}
