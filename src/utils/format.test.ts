import { describe, expect, it } from 'vitest'
import { formatBytes } from './format'

describe('formatBytes', () => {
  it.each([
    [0,                 '0 B'],
    [1023,              '1023 B'],
    [1024,              '1.0 KB'],
    [1536,              '1.5 KB'],
    [1024 * 1024 - 1,   '1024.0 KB'],
    [1024 * 1024,       '1.0 MB'],
    [5.25 * 1024 ** 2,  '5.3 MB'],
  ])('%d bytes → %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })
})
