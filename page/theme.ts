import {
  theme,
} from './selector'

const darkMQL = window.matchMedia('(prefers-color-scheme: dark)')
let isSystemDark = darkMQL.matches
let followSystemTheme = true

function setColorTransition(enabled: boolean) {
  theme.style.setProperty('--color-transition', enabled ? '' : 'none')
}

function withTransition(remove: string, add: string) {
  setColorTransition(true)
  theme.classList.remove(remove)
  theme.classList.add(add)
  setTimeout(() => setColorTransition(false), 500)
}

function setLightTheme() {
  withTransition('fcitx-dark', 'fcitx-light')
}

function setDarkTheme() {
  withTransition('fcitx-light', 'fcitx-dark')
}

function systemThemeHandler() {
  if (isSystemDark) {
    setDarkTheme()
  }
  else {
    setLightTheme()
  }
}

darkMQL.addEventListener('change', (event) => {
  isSystemDark = event.matches
  if (followSystemTheme) {
    systemThemeHandler()
  }
})

export function setTheme(theme: 0 | 1 | 2) {
  switch (theme) {
    case 0:
      followSystemTheme = true
      systemThemeHandler()
      break
    case 1:
      followSystemTheme = false
      setLightTheme()
      break
    case 2:
      followSystemTheme = false
      setDarkTheme()
      break
  }
}

const accentColorMap = {
  'null': 'blue',
  '-1': 'graphite',
  '0': 'red',
  '1': 'orange',
  '2': 'yellow',
  '3': 'green',
  '4': 'blue',
  '5': 'purple',
  '6': 'pink',
}

type ACCENT_COLOR = keyof typeof accentColorMap

let accentColor: ACCENT_COLOR = 'null'

export function setAccentColor(color: number | null | string) {
  if (typeof color === 'string') {
    theme.style.setProperty('--accent-color', color)
    return
  }
  theme.style.setProperty('--accent-color', '')
  theme.classList.remove(`fcitx-${accentColorMap[accentColor]}`)
  const key = String(color)
  if (key in accentColorMap) {
    accentColor = key as ACCENT_COLOR
  }
  else {
    accentColor = '4'
  }
  theme.classList.add(`fcitx-${accentColorMap[accentColor]}`)
}
