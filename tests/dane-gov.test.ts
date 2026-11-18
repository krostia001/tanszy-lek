import { describe, expect, it } from 'vitest'
import { parseResources, pickResource } from '../scripts/lib/dane-gov'
import response from './fixtures/dane-gov-resources-397.json'

describe('dane.gov.pl API client', () => {
  const resources = parseResources(response)

  it('maps JSON:API resources to plain objects', () => {
    expect(resources).toHaveLength(response.data.length)
    for (const resource of resources) {
      expect(resource).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        format: expect.any(String),
      })
    }
  })

  it('picks the downloadable CSV file of the medicinal products register', () => {
    const csv = pickResource(resources, 'csv')
    expect(csv.format).toBe('csv')
    expect(csv.downloadUrl).toMatch(/^https:\/\/api\.dane\.gov\.pl\/resources\/\d+/)
  })

  it('ignores website links without a file', () => {
    expect(() => pickResource(resources, 'html')).toThrow(/No downloadable "html" resource/)
  })
})
