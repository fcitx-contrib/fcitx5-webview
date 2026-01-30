declare global {
  interface Window {
    cppCalls: Record<string, any[]>[]
  }
}

export {}
