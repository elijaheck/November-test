import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pageActionOf } from './approval-rules.ts'

test('read-only scripts need no approval', () => {
  assert.equal(pageActionOf('document.title'), null)
  assert.equal(pageActionOf("[...document.querySelectorAll('a')].map((a) => a.href)"), null)
  assert.equal(pageActionOf('input.value === "x"'), null)
})

test('acting scripts name what they would do, the riskiest first', () => {
  assert.equal(pageActionOf("document.querySelector('button').click()"), 'click')
  assert.equal(pageActionOf("el.value = 'hi'; el.form.requestSubmit()"), 'submit')
  assert.equal(pageActionOf("fetch('/api/send', { method: 'POST' })"), 'send')
  assert.equal(pageActionOf("box.value = 'hello'"), 'type')
  assert.equal(pageActionOf("el.dispatchEvent(new MouseEvent('click'))"), 'click')
})
