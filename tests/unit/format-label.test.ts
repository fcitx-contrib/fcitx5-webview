import { beforeEach, describe, expect, it } from 'vitest'
import { getLabelFormatter, setLastLabels } from '../../page/format-label'

describe('getLabelFormatter', () => {
  beforeEach(() => {
    setLastLabels([])
  })

  it.each([
    {
      name: 'empty - use default formatter',
      labels: [],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'pure numeric',
      labels: ['1', '2', '3'],
      inputs: [0, 1, 2, 3],
      expected: ['0', '1', '2', '3'],
    },
    {
      name: 'dot',
      labels: ['1.', '2.', '3.'],
      inputs: [0, 1, 2, 3],
      expected: ['0.', '1.', '2.', '3.'],
    },
    {
      name: 'no pattern - use default formatter',
      labels: ['a', 'b', 'c'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'fake pattern - use default formatter',
      labels: ['1.', '.2', '3.'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'multiple 1s in first label - use default formatter',
      labels: ['1a1', '1a2'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains ⌃ (Control) - use default formatter',
      labels: ['⌃1', '⌃2', '⌃3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains ⌥ (Option) - use default formatter',
      labels: ['⌥1', '⌥2', '⌥3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains ⇧ (Shift) - use default formatter',
      labels: ['⇧1', '⇧2', '⇧3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains ⌘ (Command) - use default formatter',
      labels: ['⌘1', '⌘2', '⌘3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains C- - use default formatter',
      labels: ['C-1', 'C-2', 'C-3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains A- - use default formatter',
      labels: ['A-1', 'A-2', 'A-3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains S- - use default formatter',
      labels: ['S-1', 'S-2', 'S-3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
    {
      name: 'contains M- - use default formatter',
      labels: ['M-1', 'M-2', 'M-3'],
      inputs: [0, 1, 2],
      expected: ['0', '1', '2'],
    },
  ])('$name', ({ labels, inputs, expected }) => {
    setLastLabels(labels)
    const formatter = getLabelFormatter()

    inputs.forEach((input, index) => {
      expect(formatter(input)).toBe(expected[index])
    })
  })
})
