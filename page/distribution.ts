// Must be imported first

const distribution = <string>process.env.FCITX_DISTRIBUTION ?? '' // eslint-disable-line node/prefer-global/process

let fcitx: FCITX // eslint-disable-line import/no-mutable-exports

if (distribution === 'fcitx5-js') {
  fcitx = window.fcitx
}
else {
  // @ts-expect-error f5m binds C++ function to JS global function, but we want to call fcitx._select for both f5m and f5j.
  fcitx = window
  window.fcitx = fcitx

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
}

fcitx.distribution = distribution

export {
  fcitx,
}
