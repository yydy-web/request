import { describe, expect, it } from 'vitest'
import { add } from '../src/index.ts'

describe('Hi', () => {
  it('should works', () => {
    expect(add(1, 2)).equal(3)
  })
})
