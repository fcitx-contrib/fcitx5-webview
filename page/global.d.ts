declare global {
  interface Window {
    // C++ APIs that api.ts calls
    _select: (index: number) => void
    _resize: (x: number, y: number, width: number, height: number) => void

    // JavaScript APIs that webview_candidate_window.mm calls
    setCandidates: (cands: string[], labels: string[], highlighted: number) => void
    setLayout: (layout: 0 | 1) => void
    updateInputPanel: (preeditHTML: string, auxUpHTML: string, auxDownHTML: string) => void
    resize: (x: number, y: number) => void
    setTheme: (theme: 0 | 1 | 2) => void
    setAccentColor: (color: number | null) => void
  }
}

export {}
