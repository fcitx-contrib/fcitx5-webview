import {
  panel
} from './selector'

const darkMQL = window.matchMedia('(prefers-color-scheme: dark)')
let isSystemDark = darkMQL.matches
let followSystemTheme = true

function setLightTheme () {
  panel.classList.remove('dark')
  panel.classList.add('light')
}

function setDarkTheme () {
  panel.classList.remove('light')
  panel.classList.add('dark')
}

function systemThemeHandler () {
  if (isSystemDark) {
    setDarkTheme()
  } else {
    setLightTheme()
  }
}

darkMQL.addEventListener('change', event => {
  isSystemDark = event.matches
  if (followSystemTheme) {
    systemThemeHandler()
  }
})

export function setTheme (theme: 0 | 1 | 2) {
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

/* eslint-disable quote-props */
const accentColorMap = {
  'null': 'blue',
  '-1': 'graphite',
  '0': 'red',
  '1': 'orange',
  '2': 'yellow',
  '3': 'green',
  '4': 'blue',
  '5': 'purple',
  '6': 'pink'
}
/* eslint-enable quote-props */
type ACCENT_COLOR = keyof typeof accentColorMap

let accentColor: ACCENT_COLOR = 'null'

export function setAccentColor (color: number | null) {
  panel.classList.remove(accentColorMap[accentColor])
  const key = String(color)
  if (key in accentColorMap) {
    accentColor = key as ACCENT_COLOR
  } else {
    accentColor = '4'
  }
  panel.classList.add(accentColorMap[accentColor])
}
