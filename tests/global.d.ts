declare global {
  type CppCall = {
    resize: [number, number, number, number]
  } | {
    select: number
  }

  interface Window {
    cppCalls: CppCall[]
  }
}

export {}
