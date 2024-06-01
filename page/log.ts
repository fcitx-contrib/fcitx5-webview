export function fcitxLog (...args: unknown[]) {
  for (let i = 0; i < args.length; ++i) {
    if (i > 0) {
      window._log(' ')
    }
    const arg = args[i]
    let serialized = ''
    if (typeof arg === 'object') {
      try {
        serialized = JSON.stringify(arg)
      } catch {}
    }
    window._log(serialized || String(arg))
  }
  window._log('\n')
}
