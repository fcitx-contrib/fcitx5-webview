declare global {
  type CppCall = {
    resize: [number, number, number, number, boolean]
  } | {
    select: number
  }

  interface Window {
    cppCalls: CppCall[]
  }
}

export {}
