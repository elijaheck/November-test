import assert from 'node:assert/strict'
import { test } from 'node:test'

import { addressToUrl, displayAddress } from './railAddress.ts'

test('the address bar opens URLs, hosts and searches', () => {
  assert.equal(addressToUrl('https://grok.com/'), 'https://grok.com/')
  assert.equal(addressToUrl('grok.com'), 'https://grok.com')
  assert.equal(
    addressToUrl('news.ycombinator.com/item?id=1'),
    'https://news.ycombinator.com/item?id=1',
  )
  assert.equal(addressToUrl('localhost:5173'), 'http://localhost:5173')
  assert.equal(
    addressToUrl('best peptide tracker'),
    'https://www.google.com/search?q=best%20peptide%20tracker',
  )
  assert.equal(addressToUrl('   '), null)
})

test('the address bar shows a page without its scheme', () => {
  assert.equal(displayAddress('https://www.youtube.com/'), 'youtube.com/')
  assert.equal(displayAddress(undefined), '')
})
