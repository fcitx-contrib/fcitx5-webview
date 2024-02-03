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
