import assert from 'node:assert/strict'
import { test } from 'node:test'

import { spaceTint } from './spaceTint.ts'

test('named spaces keep their colors and others stay stable', () => {
  assert.equal(spaceTint('Personal'), '64 120 255')
  assert.equal(spaceTint(' TTG '), '34 170 110')
  assert.equal(spaceTint('Peptracked'), '150 90 245')
  assert.equal(spaceTint('Side project'), spaceTint('side project'))
})
