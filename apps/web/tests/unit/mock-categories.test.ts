import { describe, expect, it } from 'vitest'
import { mockCategories } from '../../app/data/mock-categories'

describe('mockCategories', () => {
  it('slug уникальны и пригодны для URL', () => {
    const slugs = mockCategories.map((category) => category.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
})
