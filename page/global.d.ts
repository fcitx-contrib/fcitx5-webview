declare global {
  interface Window {
    // C++ APIs that api.ts calls
    _onload?: () => void
    _select: (index: number) => void
    _page: (next: boolean) => void
    _resize: (dx: number, dy: number, shadowTop: number, shadowRight: number, shadowBottom: number, shadowLeft: number, fullWidth: number, fullHeight: number, enlargedWidth: number, enlargedHeight: number, dragging: boolean) => void

    // JavaScript APIs that webview_candidate_window.mm calls
    setCandidates: (cands: string[], labels: string[], comments: string[], highlighted: number, markText: string, pageable: boolean, hasPrev: boolean, hasNext: boolean) => void
    setLayout: (layout: 0 | 1) => void
    updateInputPanel: (preeditHTML: string, auxUpHTML: string, auxDownHTML: string) => void
    resize: (dx: number, dy: number, dragging: boolean, hasContextmenu: boolean) => void
    setTheme: (theme: 0 | 1 | 2) => void
    setAccentColor: (color: number | null) => void
    setStyle: (style: string) => void
  }
}

export {}
