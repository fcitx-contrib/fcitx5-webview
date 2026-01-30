export function log(...args: unknown[]) {
  for (let i = 0; i < args.length; ++i) {
    if (i > 0) {
      window.fcitx('log', ' ')
    }
    const arg = args[i]
    let serialized = ''
    if (typeof arg === 'object') {
      try {
        serialized = JSON.stringify(arg)
      }
      catch {}
    }
    window.fcitx('log', serialized || String(arg))
  }
  window.fcitx('log', '\n')
}
