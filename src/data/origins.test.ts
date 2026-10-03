import { describe, expect, it } from 'vitest'
import { PROCESSES } from './beans'
import { normalize, ORIGINS, searchOrigins } from './origins'

describe('origin database', () => {
  it('has unique ids and taste notes for every process', () => {
    expect(new Set(ORIGINS.map((o) => o.id)).size).toBe(ORIGINS.length)
    for (const o of ORIGINS) {
      expect(o.common.length).toBeGreaterThan(0)
      for (const p of PROCESSES) expect(o.notes[p.id].length, `${o.id} ${p.id}`).toBeGreaterThanOrEqual(3)
      expect(o.about.id && o.about.en).toBeTruthy()
    }
  })
})

describe('searchOrigins', () => {
  const ids = (q: string) => searchOrigins(q).map((o) => o.id)

  it('finds by name, region, alias, country and variety', () => {
    expect(ids('gayo')[0]).toBe('gayo')
    expect(ids('Aceh')).toContain('gayo')
    expect(ids('bali')[0]).toBe('kintamani')
    expect(ids('ethiopia')).toEqual(expect.arrayContaining(['yirgacheffe', 'guji', 'sidamo']))
    expect(ids('sl28')).toEqual(['kenya'])
    expect(ids('Đắk Lắk')).toEqual(['daklak'])
    expect(ids('sumatera')).toEqual(expect.arrayContaining(['gayo', 'kerinci', 'mandailing', 'lampung']))
  })

  it('needs every word to match and puts name matches first', () => {
    expect(ids('flores bajawa')).toEqual(['bajawa'])
    expect(ids('flores')[0]).toBe('bajawa')
    expect(ids('toraja')[0]).toBe('toraja')
  })

  it('returns nothing for an empty or unknown query', () => {
    expect(searchOrigins('  ')).toEqual([])
    expect(searchOrigins('kopi luar angkasa')).toEqual([])
  })

  it('normalizes accents and punctuation', () => {
    expect(normalize('  Costa Rica — Tarrazú ')).toBe('costa rica tarrazu')
  })
})
