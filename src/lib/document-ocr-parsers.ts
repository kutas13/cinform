type ChildRow = {
  first_name: string
  last_name: string
  nationality: string
  birth_date: string
}

function normalizeText(s: string): string {
  return s
    .replace(/\r/g, '\n')
    .replace(/[İI]/g, 'I')
    .replace(/[Ğ]/g, 'G')
    .replace(/[Ü]/g, 'U')
    .replace(/[Ş]/g, 'S')
    .replace(/[Ö]/g, 'O')
    .replace(/[Ç]/g, 'C')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIsoDate(ddmmyyyy: string): string {
  const clean = ddmmyyyy.replace(/[^\d]/g, '')
  if (clean.length !== 8) return ''
  return `${clean.slice(4, 8)}-${clean.slice(2, 4)}-${clean.slice(0, 2)}`
}

export function parsePassportText(raw: string): {
  full_name?: string
  birth_year?: number
  passport_issue_place?: string
} {
  const text = normalizeText(raw).toUpperCase()
  const out: { full_name?: string; birth_year?: number; passport_issue_place?: string } = {}

  const mrz = text.match(/P<TUR([A-Z<]+)<<([A-Z<]+)/)
  if (mrz) {
    const last = mrz[1].replace(/</g, ' ').trim()
    const first = mrz[2].replace(/</g, ' ').trim()
    out.full_name = `${first} ${last}`.replace(/\s+/g, ' ').trim()
  }

  const birth = text.match(/\b(\d{2}[.\-/]\d{2}[.\-/]\d{4})\b/)
  if (birth) {
    const iso = toIsoDate(birth[1])
    if (iso) out.birth_year = parseInt(iso.slice(0, 4), 10)
  }

  const issuePlace = text.match(/DOGUM YERI[^A-Z0-9]{0,8}([A-Z ]{3,30})/)
  if (issuePlace) out.passport_issue_place = issuePlace[1].trim()

  return out
}

export function parseNufusText(raw: string): {
  tc_number?: string
  father_first_name?: string
  mother_first_name?: string
  marital_status?: 'Single' | 'Married'
  children_data: ChildRow[]
} {
  const text = normalizeText(raw).toUpperCase()
  const out: {
    tc_number?: string
    father_first_name?: string
    mother_first_name?: string
    marital_status?: 'Single' | 'Married'
    children_data: ChildRow[]
  } = { children_data: [] }

  const tc = text.match(/\b([1-9]\d{10})\b/)
  if (tc) out.tc_number = tc[1]

  const father = text.match(/BABA ADI[^A-Z0-9]{0,8}([A-Z ]{2,30})/)
  if (father) out.father_first_name = father[1].trim().split(' ')[0]

  const mother = text.match(/ANA ADI[^A-Z0-9]{0,8}([A-Z ]{2,30})/)
  if (mother) out.mother_first_name = mother[1].trim().split(' ')[0]

  if (/\bESI\b|\bESI\s/.test(text)) out.marital_status = 'Married'
  else out.marital_status = 'Single'

  const lines = raw
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  for (const line of lines) {
    const upper = line.toUpperCase()
    if (!/(KIZI|KIZ|OGLU|OĞLU)/.test(upper)) continue
    const date = upper.match(/(\d{2}[.\-/]\d{2}[.\-/]\d{4})/)
    if (!date) continue

    const tokens = upper.split(/\s+/).filter(Boolean)
    const relIdx = tokens.findIndex((t) => ['KIZI', 'KIZ', 'OGLU', 'OĞLU'].includes(t))
    if (relIdx < 1) continue

    const name = tokens[relIdx - 1] || ''
    const surname = tokens[relIdx + 1] || ''
    if (!name || !surname) continue

    const birth_date = toIsoDate(date[1])
    if (!birth_date) continue

    const key = `${name}|${surname}|${birth_date}`
    if (seen.has(key)) continue
    seen.add(key)

    out.children_data.push({
      first_name: name,
      last_name: surname,
      nationality: 'Türkiye',
      birth_date,
    })
  }

  return out
}

export function parseCompanyCertificateText(raw: string): {
  company_name?: string
  address?: string
} {
  const text = raw.replace(/\r/g, '\n')
  const upper = text.toUpperCase()
  const out: { company_name?: string; address?: string } = {}

  const name = upper.match(/FIRMA\s*[:\-]\s*([^\n]+)/)
  if (name) out.company_name = name[1].trim()

  const address = upper.match(/ADRES\s*[:\-]\s*([^\n]+)/)
  if (address) out.address = address[1].trim()

  return out
}
