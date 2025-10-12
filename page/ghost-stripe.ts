import { theme } from './selector'

const id = 'ghost-stripe'

// Ghost stripe is reproducible for macOS 15 light theme when App background is dark.
// Key is Margin=0. We make .fcitx-candidate's background transparent as a workaround.
// PS: It's not even reproducible on preview app.
export function fixGhostStripe(j: STYLE_JSON) {
  let remove = false
  if ((j.Size.OverrideDefault === 'True' && j.Size.Margin !== '0')
    || (j.Size.OverrideDefault === 'False' && theme.classList.contains('fcitx-macos-26') /* all builtin themes that have 0 margin */)) {
    remove = true
  }
  let style = document.head.querySelector(`#${id}`)
  if (remove) {
    return style?.remove()
  }
  if (!style) {
    style = document.createElement('style')
    style.id = id
    document.head.appendChild(style)
  }
  let innerHTML = '.fcitx-candidate.fcitx-highlighted { background-color: transparent !important; }'
  if (j.Highlight.HoverBehavior === 'Add') {
    innerHTML += `.fcitx-candidate:hover { background-color: transparent !important; }`
  }
  style.innerHTML = innerHTML
}
