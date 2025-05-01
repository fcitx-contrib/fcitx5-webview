declare global {
  type CppCall = {
    resize: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, boolean]
  } | {
    select: number
  } | {
    action: [number, number]
  } | {
    highlight: number
  }

  interface Window {
    cppCalls: CppCall[]
  }
}

export {}
