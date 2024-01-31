declare global {
  interface Window {
    // C++ APIs that api.ts calls
    _select: (index: number) => void
    _resize: (x: number, y: number, width: number, height: number) => void
  }
}

export {}
