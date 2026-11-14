import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isPreviewableUrl, parseLinkPreview } from './parse.ts'

test('parseLinkPreview prefers Open Graph tags', () => {
  const html = `<html><head><title>Fallback</title>
    <meta property="og:title" content="Peptides &amp; you">
    <meta content="A short guide." name="description">
    <meta property="og:site_name" content="Pep Weekly">
    <meta property="og:image" content="/cover.png"></head></html>`
  const preview = parseLinkPreview(html, 'https://www.example.com/a/b')

  assert.equal(preview.title, 'Peptides & you')
  assert.equal(preview.summary, 'A short guide.')
  assert.equal(preview.site, 'Pep Weekly')
  assert.equal(preview.image, 'https://www.example.com/cover.png')
})

test('parseLinkPreview falls back to the title and first real paragraph', () => {
  const html = `<title> Plain page </title><nav><p>Home About Contact links that are long enough to count here</p></nav>
    <p>short</p><p>This paragraph is long enough to be a summary of the page, so it wins.</p>`
  const preview = parseLinkPreview(html, 'https://www.example.com/')

  assert.equal(preview.title, 'Plain page')
  assert.equal(preview.site, 'example.com')
  assert.match(preview.summary, /^This paragraph/)
  assert.equal(preview.image, undefined)
})

test('isPreviewableUrl allows only public http(s) pages', () => {
  assert.equal(isPreviewableUrl('https://facet.surf'), true)
  assert.equal(isPreviewableUrl('http://localhost:3000'), false)
  assert.equal(isPreviewableUrl('http://192.168.1.4/admin'), false)
  assert.equal(isPreviewableUrl('http://[::1]/'), false)
  assert.equal(isPreviewableUrl('file:///etc/passwd'), false)
  assert.equal(isPreviewableUrl('nope'), false)
})
