let lastLabels: string[] = []
const defaultFormatter = (i: number) => `${i}`
let formatter: typeof defaultFormatter | null = null

export function setLastLabels(labels: string[]) {
  lastLabels = labels
  formatter = null
}

function guessLabelFormatter() {
  if (lastLabels.length === 0) {
    return defaultFormatter
  }
  const label1 = lastLabels[0]

  // Check for special modifier characters or combinations
  if (/[⌃⌥⇧⌘]/.test(label1) || /C-|A-|S-|M-/.test(label1)) {
    return defaultFormatter
  }

  const index = label1.indexOf('1')
  if (index === -1 || label1.lastIndexOf('1') !== index) {
    return defaultFormatter
  }
  const formatter = (i: number) => label1.replace('1', `${i}`)
  for (let i = 1; i < Math.min(lastLabels.length, 10); ++i) {
    const label = (i + 1) % 10
    if (lastLabels[i] !== formatter(label)) {
      return defaultFormatter
    }
  }
  return formatter
}

export function getLabelFormatter() {
  if (formatter === null) {
    formatter = guessLabelFormatter()
  }
  return formatter
}
