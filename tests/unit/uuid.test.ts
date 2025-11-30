import { describe, it, expect } from 'vitest'
import { v4 as uuidv4 } from '@/utils/uuid'

describe('uuid', () => {
  it('should generate valid UUID v4', () => {
    const uuid = uuidv4()
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    expect(uuid).toMatch(uuidRegex)
  })

  it('should generate unique UUIDs', () => {
    const uuid1 = uuidv4()
    const uuid2 = uuidv4()
    
    expect(uuid1).not.toBe(uuid2)
  })

  it('should have correct length', () => {
    const uuid = uuidv4()
    expect(uuid.length).toBe(36) // 32 hex chars + 4 hyphens
  })
})
