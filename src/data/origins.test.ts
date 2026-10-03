import { describe, expect, it } from 'vitest'
import { PROCESSES } from './beans'
import { ISLANDS, normalize, ORIGINS, searchOrigins } from './origins'

describe('origin database', () => {
  it('has unique ids and taste notes for every process', () => {
    expect(new Set(ORIGINS.map((o) => o.id)).size).toBe(ORIGINS.length)
    for (const o of ORIGINS) {
      expect(o.common.length).toBeGreaterThan(0)
      for (const p of PROCESSES) expect(o.notes[p.id].length, `${o.id} ${p.id}`).toBeGreaterThanOrEqual(3)
      expect(o.about.id && o.about.en).toBeTruthy()
    }
  })

  it('files every Indonesian origin, and only those, under an island', () => {
    const indonesian = ORIGINS.filter((o) => o.country.en === 'Indonesia')
    expect(indonesian.length).toBeGreaterThanOrEqual(45)
    for (const o of ORIGINS) expect(o.island !== undefined, o.id).toBe(o.country.en === 'Indonesia')
    for (const i of ISLANDS) expect(indonesian.some((o) => o.island === i.id), i.id).toBe(true)
  })
})

describe('searchOrigins', () => {
  const ids = (q: string) => searchOrigins(q).map((o) => o.id)

  it('finds by name, region, alias, country and variety', () => {
    expect(ids('gayo')[0]).toBe('gayo')
    expect(ids('Aceh')).toContain('gayo')
    expect(ids('bali')).toEqual(['kintamani', 'pupuan'])
    expect(ids('ethiopia')).toEqual(expect.arrayContaining(['yirgacheffe', 'guji', 'sidamo']))
    expect(ids('sl28')).toEqual(['kenya'])
    expect(ids('Đắk Lắk')).toEqual(['daklak'])
    expect(ids('sumatera')).toEqual(expect.arrayContaining(['gayo', 'kerinci', 'mandailing', 'lampung']))
    expect(ids('jawa')).toEqual(expect.arrayContaining(['puntang', 'merapi', 'ijen', 'banyuwangi']))
    expect([...ids('java')].sort()).toEqual([...ids('jawa')].sort())
    expect(ids('kalimantan')).toEqual(['liberikaKayong'])
    expect(ids('papua')).toEqual(['wamena', 'moanemani'])
    expect(ids('meranti')).toEqual(['liberikaMeranti'])
    expect(ids('excelsa')).toEqual(['wonosalam'])
    expect(ids('pangalengan')).toEqual(['malabar'])
    expect(ids('sindoro')[0]).toBe('sindoroSumbing')
    expect(ids('jogja')).toEqual(expect.arrayContaining(['merapi', 'menoreh']))
  })

  it('needs every word to match and puts name matches first', () => {
    expect(ids('flores bajawa')).toEqual(['bajawa'])
    expect(ids('flores')[0]).toBe('bajawa')
    expect(ids('toraja')[0]).toBe('toraja')
  })

  it('finds parts of words while typing, but drops them once a word matches whole', () => {
    expect(ids('bal')).toEqual(expect.arrayContaining(['kintamani', 'pupuan', 'wamena', 'sembalun']))
    expect(ids('bali')).not.toContain('wamena')
    expect(ids('jawa')).not.toContain('bajawa')
    expect(ids('punt')).toEqual(['puntang'])
  })

  it('returns nothing for an empty or unknown query', () => {
    expect(searchOrigins('  ')).toEqual([])
    expect(searchOrigins('kopi luar angkasa')).toEqual([])
  })

  it('normalizes accents and punctuation', () => {
    expect(normalize('  Costa Rica — Tarrazú ')).toBe('costa rica tarrazu')
  })
})
