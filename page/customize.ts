import { setBlur } from './ux'

type CONFIG_BOOL = 'False' | 'True'

type STYLE_JSON = {
  BackgroundBlur: CONFIG_BOOL
  BlurRadius: string
  Shadow: CONFIG_BOOL
}

export function setStyle (style: string) {
  const j = JSON.parse(style) as STYLE_JSON
  const rules: {[key: string]: {[key: string]: string}} = { '.panel.basic': {} }

  if (j.BackgroundBlur === 'True') {
    setBlur(true)
    rules['.blur'] = { '-webkit-backdrop-filter': `blur(${j.BlurRadius}px)` }
  } else {
    setBlur(false)
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
    document.querySelector('.panel-blur-outer')?.classList.remove('blur')
  }

  if (j.Shadow === 'False') {
    rules['.panel.basic']['box-shadow'] = 'none'
  }

  const basic = document.head.querySelector('#basic')
  if (basic) {
    basic.innerHTML = Object.entries(rules).map(([selector, block]) =>
      `${selector} {` + Object.entries(block).map(([key, value]) =>
        `${key}: ${value};`).join('\n') + '}').join('\n')
  }
}
