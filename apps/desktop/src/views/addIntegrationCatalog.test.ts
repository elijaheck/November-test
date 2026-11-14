import assert from 'node:assert/strict'
import test from 'node:test'

import { buildGcpCredentialSections } from '../components/agent/panel/credentialSections.ts'

import { CATALOG } from './addIntegrationCatalog.ts'

test("the catalog offers only the product's connector categories", () => {
  assert.deepEqual(
    CATALOG.map((category) => category.id),
    ['source-control', 'project-management', 'document', 'email', 'messaging'],
  )
  // Cloud consoles (and Firebase through GCP) are not offered.
  assert.equal(
    CATALOG.flatMap((category) => category.items).filter((item) => item.key === 'gcp').length,
    0,
  )
})

test('Firebase credential discovery keeps the existing GCP binding identifiers', () => {
  const [section] = buildGcpCredentialSections([
    {
      serviceAccountId: 'binding',
      projectId: 'example-project',
      serviceAccountEmail: 'connector@example.test',
    },
  ])

  assert.equal(section.title, 'Google Cloud / Firebase')
  assert.equal(section.provider, 'gcp')
  assert.equal(section.items[0].id, 'binding')
})
