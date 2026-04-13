/** Parse text extracted from PRC visa application PDF (English labels). Heuristic — always review before save. */

export type PdfImportCustomer = {
  full_name: string
  birth_year: number
  birth_city: string
  birth_province: string
  tc_number: string
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Other'
  passport_issue_place: string
  home_address: string
  phone_number: string
  email: string
  occupation_type: 'owner' | 'employee'
  work_start_year: number
  work_start_month: number
  work_end_year?: number
  work_end_month?: number
  father_first_name: string
  father_last_name: string
  father_nationality: string
  father_birth_date: string
  mother_first_name: string
  mother_last_name: string
  mother_nationality: string
  mother_birth_date: string
  children_count: number
  children_data?: Array<{
    first_name: string
    last_name: string
    nationality: string
    birth_date: string
  }>
}

export type PdfImportTurkishCompany = {
  company_name: string
  address: string
  phone: string
  manager_name: string
}

export type PdfImportChineseInvite = {
  organization_name: string
  phone: string
  email: string
  address_line: string
}

export type ChinaVisaPdfParseResult = {
  customer: Partial<PdfImportCustomer>
  turkishCompany: Partial<PdfImportTurkishCompany>
  chineseInvite?: Partial<PdfImportChineseInvite>
  warnings: string[]
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function normalizeNoisyPdfText(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
}

function fixErdoGan(s: string): string {
  return s.replace(/\bERDO\s+GAN\b/gi, 'ERDOGAN')
}

function normalizePhoneValue(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `0${digits}`
  if (digits.length >= 11) return digits.slice(0, 11)
  return digits
}

/** Split "NURETTIN ERDO GAN" -> first / last for DB form */
function splitPersonName(line: string): { first: string; last: string } {
  const cleaned = fixErdoGan(normalizeSpaces(line))
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/** Line after Family/Given name row: often "ZHANG SAN" or "ERDO GAN FATIH" (family + given). */
function parseApplicantFullName(text: string): string | null {
  const byLabels = text.match(/1\.1A[^\n]*\n\s*([A-Z][A-Z\s]{1,80})[\s\S]{0,120}?1\.1B[^\n]*\n\s*([A-Z][A-Z\s]{1,80})/i)
  if (byLabels) {
    const family = fixErdoGan(normalizeSpaces(byLabels[1]))
    const given = fixErdoGan(normalizeSpaces(byLabels[2]))
    return normalizeSpaces(`${given} ${family}`)
  }

  const rowStyle = text.match(/1\.1A[^\n]*1\.1B[^\n]*\n\s*([A-Z][A-Z\s]{3,80})/i)
  if (rowStyle) {
    const nameLine = fixErdoGan(normalizeSpaces(rowStyle[1]))
    const parts = nameLine.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const given = parts[parts.length - 1]
      const family = parts.slice(0, -1).join(' ')
      return normalizeSpaces(`${given} ${family}`)
    }
  }

  const m = text.match(
    /Given name\(s\)[）)]?\s*[：:]\s*(?:1\.1C[^\n]*)?\s*\n\s*([A-Z][A-Z0-9\s]{2,80})/im
  )
  if (!m) return null
  const raw = normalizeSpaces(m[1]).replace(/^\d+\s*/, '')
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const given = parts[parts.length - 1]
    const family = parts.slice(0, -1).join(' ')
    return fixErdoGan(normalizeSpaces(`${given} ${family}`))
  }
  const cleaned = fixErdoGan(raw)
  if (/^[A-Z][A-Z\s]{3,80}$/.test(cleaned)) return cleaned
  return null
}

function parseApplicantNameFromPassportContext(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => normalizeSpaces(l).toUpperCase())
    .filter(Boolean)
  const passportIdx = lines.findIndex((l) => /\b[A-Z]\d{8}\b/.test(l))
  if (passportIdx < 0) return null

  const stopWords = new Set([
    'MALE',
    'FEMALE',
    'SINGLE',
    'MARRIED',
    'ORDINARY',
    'TURKIYE',
    'TURKIYE OR REGION',
    'COMPANY EMPLOYEE',
    'BUSINESSPERSON',
  ])

  for (let i = passportIdx - 1; i >= Math.max(0, passportIdx - 20); i--) {
    const line = lines[i]
    if (!line) continue
    if (stopWords.has(line)) continue
    if (/\d/.test(line)) continue
    if (/VISA|APPLICATION|FORM|REPUBLIC|CHINA|PASSPORT|NUMBER/.test(line)) continue
    if (!/^[A-Z\s]{4,60}$/.test(line)) continue
    const words = line.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 4) {
      return fixErdoGan(normalizeSpaces(words.join(' ')))
    }
  }
  return null
}

function parseApplicantNameFromGenderBlock(text: string): string | null {
  const upper = text.toUpperCase()

  const aroundGender = upper.match(
    /([A-Z][A-Z\s]{3,60})\s+(?:MALE|FEMALE)\s+\d{4}[-/.]\d{2}[-/.]\d{2}/
  )
  if (aroundGender) {
    const candidate = fixErdoGan(normalizeSpaces(aroundGender[1]))
    const words = candidate.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 4) return candidate
  }

  const aroundPassport = upper.match(
    /\b(?:[A-Z]\d{8}|[A-Z]{1,2}\d{7,8})\b[\s\S]{0,180}?\b([A-Z][A-Z\s]{3,60})\b[\s\S]{0,80}?\b(?:MALE|FEMALE)\b/
  )
  if (aroundPassport) {
    const candidate = fixErdoGan(normalizeSpaces(aroundPassport[1]))
    const words = candidate.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 4) return candidate
  }

  return null
}

function parseBirthYear(text: string): number | null {
  const m = text.match(/Date of birth[^\d]{0,40}(\d{4})-(\d{2})-(\d{2})/i)
  if (!m) return null
  return parseInt(m[1], 10)
}

function parseTc(text: string): string | null {
  const m = text.match(/National ID number[：:\s]*(\d{11})\b/i)
  if (m) return m[1]
  const m2 = text.match(/1\.6B[\s\S]{0,220}?(\d[\d\s]{9,16}\d)/i)
  if (m2) {
    const digits = m2[1].replace(/\D/g, '')
    if (digits.length >= 11) return digits.slice(0, 11)
  }
  const m3 = text.match(/\b(\d{11})\b/)
  return m3 ? m3[1] : null
}

function parseMarital(text: string): PdfImportCustomer['marital_status'] | null {
  const checked = '(?:☑|√|✓|■|\\[x\\]|\\(x\\)|\\(X\\)|x)'
  if (new RegExp(`${checked}\\s*[^\\n]*(?:已婚|Married)`, 'i').test(text)) return 'Married'
  if (new RegExp(`${checked}\\s*[^\\n]*(?:单身|Single)`, 'i').test(text) || /\bSingle\b[^\n]{0,40}(?:☑|√|✓|■)/i.test(text)) return 'Single'
  if (new RegExp(`${checked}\\s*[^\\n]*(?:离异|Divorced)`, 'i').test(text)) return 'Divorced'
  if (new RegExp(`${checked}\\s*[^\\n]*(?:丧偶|Widowed)`, 'i').test(text)) return 'Widowed'
  if (/5\.5A[\s\S]{0,280}Name\s+[A-Z]/i.test(text)) return 'Married'
  return null
}

function parseBirthProvinceCity(text: string): { province: string; city: string } {
  const extractAfterMarker = (marker: RegExp, stopWords: string[]): string => {
    const m = text.match(marker)
    if (!m) return ''
    const chunk = (m[1] || '')
      .split('\n')
      .map((l) => normalizeSpaces(l).toUpperCase())
      .filter(Boolean)
    for (const line of chunk) {
      const cleaned = line.replace(/[^A-Z\s]/g, ' ')
      const tokens = cleaned.split(/\s+/).filter(Boolean)
      const candidate = tokens.filter((t) => !stopWords.includes(t)).join(' ')
      if (candidate.length >= 3 && !/^PLEASE\s*SPECIFY$/i.test(candidate)) return candidate
    }
    return ''
  }

  const stopWords = [
    'MARRIED',
    'SINGLE',
    'DIVORCED',
    'WIDOWED',
    'OTHER',
    'PROVINCE',
    'STATE',
    'CITY',
    'TURKIYE',
    'PLEASE',
    'SPECIFY',
    'PLEASESPECIFY',
    'OTHER',
  ]
  const provinceFromMarker = extractAfterMarker(/1\.4B[^\n]*\n([\s\S]{0,120})/i, stopWords)
  const cityFromMarker = extractAfterMarker(/1\.4C[^\n]*\n([\s\S]{0,120})/i, stopWords)
  if (provinceFromMarker || cityFromMarker) {
    return { province: provinceFromMarker, city: cityFromMarker }
  }

  let province = ''
  let city = ''
  const prov = text.match(/1\.4B[^\n]*Province[^\n]*\n[^\n]*?(?:□|☑)?\s*([A-Z][A-Za-zığüşöçİĞÜŞÖÇ\s]{1,40})/i)
  const cit = text.match(/1\.4C[^\n]*City[^\n]*\n[^\n]*?(?:□|☑)?\s*([A-Z][A-Za-zığüşöçİĞÜŞÖÇ\s]{1,40})/i)
  if (prov) province = normalizeSpaces(prov[1]).split(/\s+/)[0] || prov[1].trim()
  if (cit) city = normalizeSpaces(cit[1]).split(/\s+/)[0] || cit[1].trim()
  if (!province || !city) {
    const bit = text.match(/\b(BITLIS|ISTANBUL|ANKARA|IZMIR)\b/gi)
    if (bit && bit.length) {
      if (!province) province = bit[0].toUpperCase()
      if (!city) city = bit[1]?.toUpperCase() || bit[0].toUpperCase()
    }
  }
  return { province: province || '', city: city || '' }
}

function parsePassportPlace(text: string): string | null {
  const block = text.match(/1\.7D[^\n]*Place of issue[^\n]*\n\s*([^\n]+)/i)
  if (block) {
    const cleaned = normalizeSpaces(block[1]).replace(/[^A-Za-z\s]/g, ' ').toUpperCase()
    const tokens = cleaned.split(/\s+/).filter(Boolean).filter((t) => t !== 'ORDINARY' && t !== 'PLACE' && t !== 'ISSUE')
    if (tokens.length > 0) return tokens.join(' ')
  }

  const m2 = text.match(/Ordinary\s+([A-Z][A-Za-z\s]{2,40})/i)
  if (m2) {
    const cleaned = normalizeSpaces(m2[1]).replace(/[^A-Za-z\s]/g, ' ').toUpperCase()
    const tokens = cleaned.split(/\s+/).filter(Boolean).filter((t) => t !== 'ORDINARY')
    if (tokens.length > 0) return tokens.join(' ')
  }
  return null
}

function parseHomeAddress(text: string): string | null {
  const m0 = text.match(/5\.1[^\n]*Current residence address[^\n]*\s+([^\n]+)\s*(?:\n|$)/i)
  if (m0) return normalizeSpaces(m0[1])
  const m = text.match(/Current residence address\s+([\s\S]+?)(?:\s*5\.2|\n\s*5\.2)/i)
  if (m) return normalizeSpaces(m[1].replace(/\s*5\.2.*$/i, ''))
  const m2 = text.match(/5\.1[^\n]*address\s+(.+)/i)
  return m2 ? normalizeSpaces(m2[1]) : null
}

function parsePhone(text: string): string | null {
  const m0 = text.match(/5\.2[^\n]*Phone number[^\n]*\s+([0-9+\s()-]{8,24})/i)
  if (m0) {
    const n = normalizePhoneValue(m0[1])
    if (n.length >= 10) return n
  }
  const block = text.match(/5\.2[^\n]*Phone number[^\n]*\n\s*([0-9+\s()-]{8,24})/i)
  if (block) {
    const normalized = normalizePhoneValue(block[1])
    if (normalized.length >= 10) return normalized
  }
  const m = text.match(/\b(\d{10,11})\b/)
  if (!m) return null
  const normalized = normalizePhoneValue(m[1])
  return normalized.length >= 10 ? normalized : null
}

function parseEmail(text: string): string | null {
  const m0 = text.match(/5\.4[^\n]*E-mail address[^\n]*\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  if (m0) return m0[1]
  const m = text.match(/E-mail address[：:\s]*\n?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  return m ? m[1] : null
}

function parseFather(text: string): { nameLine: string; birth: string | null } | null {
  const block = text.match(/5\.5B[^\n]*Father([\s\S]*?)(?=5\.5C|5\.5D|Mother)/i)
  if (!block) return null
  const sub = block[1]
  const nm =
    sub.match(/Name\s+([A-Z][A-Z\s]{2,80}?)\s+Nationality/i) ||
    sub.match(/Name\s+([A-Z][A-Z\s]{2,80}?)\s+Date of birth/i)
  const birth = sub.match(/Date of birth[^\d]*(\d{4}-\d{2}-\d{2})/i)
  if (!nm) return null
  return { nameLine: normalizeSpaces(nm[1]), birth: birth ? birth[1] : null }
}

function parseMother(text: string): { nameLine: string; birth: string | null } | null {
  const block = text.match(/5\.5C[^\n]*Mother([\s\S]*?)(?=5\.5D|子女|Child)/i)
  if (!block) return null
  const sub = block[1]
  const nm =
    sub.match(/Name\s+([A-Z][A-Z\s]{2,80}?)\s+Nationality/i) ||
    sub.match(/Name\s+([A-Z][A-Z\s]{2,80}?)\s+Date of birth/i)
  const birth = sub.match(/Date of birth[^\d]*(\d{4}-\d{2}-\d{2})/i)
  if (!nm) return null
  return { nameLine: normalizeSpaces(nm[1]), birth: birth ? birth[1] : null }
}

function parseWorkExperienceSection(text: string): {
  startYm: { y: number; m: number } | null
  endYm: { y: number; m: number } | null
  company_name: string
  address: string
  phone: string | null
  managerLine: string | null
  duty: string | null
} {
  const allDateMatches = Array.from(text.matchAll(/(\d{4}-\d{2})\s+(\d{4}-\d{2})/g))
  const dates = allDateMatches.length > 0 ? allDateMatches[allDateMatches.length - 1] : null
  let startYm: { y: number; m: number } | null = null
  let endYm: { y: number; m: number } | null = null
  if (dates) {
    const [sy, sm] = dates[1].split('-').map((x: string) => parseInt(x, 10))
    const [ey, em] = dates[2].split('-').map((x: string) => parseInt(x, 10))
    startYm = { y: sy, m: sm }
    endYm = { y: ey, m: em }
  }

  const idx = dates?.index ?? -1
  let tail = idx >= 0 ? text.slice(idx + (dates?.[0]?.length || 0)) : text
  const until = tail.search(/\n-{2,}|\n四、|\n4\.1|\n五、|Education|Highest diploma/i)
  if (until > 0) tail = tail.slice(0, until)

  const lines = tail
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^V?\d{4,5}$/.test(l))

  const companyParts: string[] = []
  const addrParts: string[] = []
  let phone: string | null = null
  let managerLine: string | null = null
  let duty: string | null = null
  let seenAddress = false

  for (const line of lines) {
    if (/^\d{4}-\d{2}$/.test(line)) continue

    // 3.2C satiri: "FURAT YIGIT/543234649" gibi supervisor + phone
    if (line.includes('/')) {
      const [leftRaw, rightRaw] = line.split('/', 2)
      const left = normalizeSpaces(leftRaw || '')
      const right = normalizePhoneValue(rightRaw || '')
      const leftWordCount = left.split(/\s+/).filter(Boolean).length
      if (left && right.length >= 8 && leftWordCount >= 2 && leftWordCount <= 5) {
        if (!managerLine) managerLine = fixErdoGan(left)
        if (!phone) phone = right
        continue
      }
    }

    if (/OWNER|WNER|MANAGER|DIRECTOR|EMPLOYEE/i.test(line) && line.includes('/')) {
      const ph = line.match(/(\d{10,11})/)
      if (ph) phone = normalizePhoneValue(ph[1])
      const left = line.split('/')[0]
      if (left && /[A-Za-z]{2,}/.test(left)) {
        managerLine = normalizeSpaces(left.replace(/\d+/g, ' '))
      }
      const dm = line.match(/(OWNER|MANAGER|DIRECTOR|EMPLOYEE|O\s*WNER)/i)
      if (dm) duty = dm[1].replace(/\s/g, '')
      continue
    }

    if (line === 'FATIH' || line === 'ERDOGAN') continue

    const districtPhone = line.match(/^([A-Z][A-Z\s]+)\/(\d{10,11})$/i)
    if (districtPhone) {
      addrParts.push(districtPhone[1].trim())
      phone = normalizePhoneValue(districtPhone[2])
      seenAddress = true
      continue
    }

    if (line.includes('/') && /^\d/.test(line) && !phone) {
      const maybePhone = normalizePhoneValue(line.split('/').pop() || '')
      if (maybePhone.length >= 10) phone = maybePhone
    }

    // 3.2B satiri: sirket / adres ayni hucrede olabilir, "/" ayirici kabul et
    if (line.includes('/') && !seenAddress) {
      const [left, right] = line.split('/')
      if (left?.trim()) companyParts.push(left.trim())
      if (right?.trim()) {
        addrParts.push(right.trim())
        seenAddress = true
      }
      continue
    }

    if (/LIMITED|SIRKETI|A\.S\.|INC\.|LTD|TICARET|SANAYI|TRAVEL|DANISMANLIK|HIZMET/i.test(line) && !seenAddress) {
      companyParts.push(line)
      continue
    }

    if (seenAddress || addrParts.length > 0) {
      if (!/^FATIH$/i.test(line)) addrParts.push(line)
    } else if (/^[A-Z]/.test(line) && line.length > 2) {
      companyParts.push(line)
    }
  }

  if (!managerLine && companyParts.length === 0 && addrParts.length === 0) {
    return {
      startYm,
      endYm,
      company_name: '',
      address: '',
      phone,
      managerLine,
      duty,
    }
  }

  return {
    startYm,
    endYm,
    company_name: fixErdoGan(normalizeSpaces(companyParts.join(' '))),
    address: fixErdoGan(normalizeSpaces(addrParts.join(', '))),
    phone,
    managerLine,
    duty,
  }
}

function parseChildren(text: string): Array<{ first_name: string; last_name: string; nationality: string; birth_date: string }> {
  const out: Array<{ first_name: string; last_name: string; nationality: string; birth_date: string }> = []
  const block = text.match(/5\.5D[^\n]*(?:Child|子女)([\s\S]*?)(?=5\.5E|5\.6|六、|6\.)/i)
  let section = block?.[1] || ''
  if (!section) {
    const idx = text.search(/5\.5D[^\n]*(?:Child|子女)/i)
    if (idx >= 0) {
      section = text.slice(idx, idx + 2200)
    }
  }
  if (!section) return out
  const compact = normalizeSpaces(section)
  const cleanChildName = (raw: string): string => {
    const fixedCountry = raw
      .replace(/\bT[UÜ]RK\s*IYE\b/gi, 'TURKIYE')
      .replace(/\bTURK[Iİ]YE\b/gi, 'TURKIYE')
    const noCountry = fixedCountry.replace(/\bTURKIYE\b/gi, ' ')
    return fixErdoGan(normalizeSpaces(noCountry)).replace(/[^A-Za-zİĞÜŞÖÇığüşöç\s]/g, ' ')
  }
  const isInvalidName = (nameLine: string): boolean => {
    const n = normalizeSpaces(nameLine).toUpperCase()
    if (!n) return true
    if (/^TURK(?:IYE)?$/.test(n)) return true
    if (/^(PLEASE|SPECIFY|NAME|NATIONALITY|DATE|BIRTH)/.test(n)) return true
    return false
  }

  const lineRows = Array.from(
    section.matchAll(
      /Name\s+([A-Za-zİĞÜŞÖÇığüşöç][A-Za-zİĞÜŞÖÇığüşöç\s]{1,80}?)\s+Nationality[\s\S]{0,100}?Date of birth\s+(\d{4}-\d{2}-\d{2})/gi
    )
  )
  if (lineRows.length > 0) {
    const seen = new Set<string>()
    for (const m of lineRows) {
      const nameLine = cleanChildName(m[1])
      if (isInvalidName(nameLine)) continue
      const parts = nameLine.split(/\s+/).filter(Boolean)
      if (parts.length < 2) continue
      const key = `${parts.join(' ')}|${m[2]}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        first_name: parts[0],
        last_name: parts.slice(1).join(' '),
        nationality: 'Türkiye',
        birth_date: m[2],
      })
    }
    if (out.length > 0) return out
  }

  const strictRows = Array.from(
    compact.matchAll(
      /Name\s+([A-Za-zİĞÜŞÖÇığüşöç][A-Za-zİĞÜŞÖÇığüşöç\s]{1,80}?)\s+Nationality\s+(?:Türkiye|Turkey|TURKIYE|TÜRKİYE)?\s*Date of birth\s+(\d{4}-\d{2}-\d{2})/gi
    )
  )
  if (strictRows.length > 0) {
    const seen = new Set<string>()
    for (const m of strictRows) {
      const nameLine = cleanChildName(m[1])
      if (isInvalidName(nameLine)) continue
      const parts = nameLine.split(/\s+/).filter(Boolean)
      if (parts.length < 2) continue
      const key = `${parts.join(' ')}|${m[2]}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        first_name: parts[0],
        last_name: parts.slice(1).join(' '),
        nationality: 'Türkiye',
        birth_date: m[2],
      })
    }
    if (out.length > 0) return out
  }

  // Primary pattern: "NAME SURNAME Türkiye YYYY-MM-DD"
  const rxPrimary =
    /([A-Za-zİĞÜŞÖÇığüşöç][A-Za-zİĞÜŞÖÇığüşöç\s]{1,80}?)\s+(Türkiye|Turkey|TURKIYE|TÜRKİYE)\s+(\d{4}-\d{2}-\d{2})/gi
  for (const m of Array.from(compact.matchAll(rxPrimary))) {
    const nameLine = cleanChildName(m[1])
    if (isInvalidName(nameLine)) continue
    const parts = nameLine.split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue
    out.push({
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
      nationality: 'Türkiye',
      birth_date: m[3],
    })
  }

  // Table-like OCR pattern: Name ... Nationality ... Date of birth ...
  const rxTable =
    /Name\s*([A-Za-zİĞÜŞÖÇığüşöç][A-Za-zİĞÜŞÖÇığüşöç\s]{1,80}?)\s+Nationality\s*(Türkiye|Turkey|TURKIYE|TÜRKİYE)\s+Date of birth\s*(\d{4}-\d{2}-\d{2})/gi
  for (const m of Array.from(compact.matchAll(rxTable))) {
    const nameLine = cleanChildName(m[1])
    if (isInvalidName(nameLine)) continue
    const parts = nameLine.split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue
    out.push({
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
      nationality: 'Türkiye',
      birth_date: m[3],
    })
  }

  if (out.length > 0) {
    const uniq = new Map<string, { first_name: string; last_name: string; nationality: string; birth_date: string }>()
    out.forEach((c) => uniq.set(`${c.first_name} ${c.last_name}|${c.birth_date}`, c))
    return Array.from(uniq.values())
  }

  if (out.length > 0) return out

  // Fallback: date'leri anchor alip onceki satirlardan name + nationality topla
  const lines = section
    .split('\n')
    .map((l) => normalizeSpaces(l))
    .filter(Boolean)
    .filter((l) => !/^(Name|Nationality|Date of birth|姓名|国籍|出生日期|Child|5\.5D)/i.test(l) && !/^\/$/.test(l))

  const seen = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const dateMatch = lines[i].match(/\b(\d{4}-\d{2}-\d{2})\b/)
    if (!dateMatch) continue

    const birth_date = dateMatch[1]
    let nationality = 'Türkiye'
    let nameLine = ''

    for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
      const line = lines[j]
      if (!line) continue
      if (
        !nameLine &&
        /[A-Za-zİĞÜŞÖÇığüşöç]/.test(line) &&
        line.split(/\s+/).length >= 2 &&
        !/\d{4}-\d{2}-\d{2}/.test(line) &&
        !/(Türkiye|Turkey|TURKIYE|TÜRKİYE)$/i.test(line) &&
        !/^(Yes|No|Citizen|Resident|Permanent|Stay|Work|Visa)/i.test(line)
      ) {
        nameLine = line
      }
      if (/(Türkiye|Turkey|TURKIYE|TÜRKİYE)/i.test(line)) {
        nationality = 'Türkiye'
      }
      if (nameLine) break
    }

    if (!nameLine) continue
    const parts = cleanChildName(nameLine).split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue

    const key = `${parts.join(' ')}|${birth_date}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
      nationality,
      birth_date,
    })
  }

  if (out.length > 0) return out

  // Final hard fallback: find all "NAME TURKIYE YYYY-MM-DD" near 5.5D region
  const regionCompact = normalizeSpaces(section)
  const rxLastResort =
    /([A-Za-zİĞÜŞÖÇığüşöç]{2,}\s+[A-Za-zİĞÜŞÖÇığüşöç]{2,}(?:\s+[A-Za-zİĞÜŞÖÇığüşöç]{2,})?)\s+(?:Türkiye|Turkey|TURKIYE|TÜRKİYE)\s+(\d{4}-\d{2}-\d{2})/gi
  const finalOut: Array<{ first_name: string; last_name: string; nationality: string; birth_date: string }> = []
  const finalSeen = new Set<string>()
  for (const m of Array.from(regionCompact.matchAll(rxLastResort))) {
    const nameLine = cleanChildName(m[1])
    if (isInvalidName(nameLine)) continue
    const parts = nameLine.split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue
    const birthYear = parseInt(m[2].slice(0, 4), 10)
    if (birthYear < 1990) continue
    const key = `${nameLine}|${m[2]}`
    if (finalSeen.has(key)) continue
    finalSeen.add(key)
    finalOut.push({
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
      nationality: 'Türkiye',
      birth_date: m[2],
    })
  }

  return finalOut
}

function parseChineseInvite(text: string): Partial<PdfImportChineseInvite> | undefined {
  const org = text.match(/6\.2A[^\n]*organization[：:\s]*\n?\s*([^\n]+)/i)
  const phone = text.match(/6\.2C[^\n]*Phone[^\n]*\n?\s*([0-9+\s]+)/i)
  const email = text.match(/6\.2D[^\n]*E-mail[^\n]*\n?\s*([^\s]+@[^\s]+)/i)
  const addr = text.match(/6\.2E[^\n]*Address[^\n]*\n?\s*([^\n]+)/i)
  if (!org && !phone && !email) return undefined
  return {
    organization_name: org ? normalizeSpaces(org[1]) : undefined,
    phone: phone ? normalizeSpaces(phone[1].replace(/\s/g, '')) : undefined,
    email: email ? email[1].trim() : undefined,
    address_line: addr ? normalizeSpaces(addr[1]) : undefined,
  }
}

export function parseChinaVisaPdfText(raw: string): ChinaVisaPdfParseResult {
  const warnings: string[] = []
  const text = raw.replace(/\r\n/g, '\n')
  const noisyNormalizedText = normalizeNoisyPdfText(text)
  const mixedText = `${text}\n${noisyNormalizedText}`

  if (
    !/Visa Application Form|中华人民共和国签证申请表|PRC|People's Republic|Personal Information|Type of Visa|Work Information/i.test(
      mixedText
    )
  ) {
    warnings.push('PDF metni standart Çin vize başvuru formu gibi görünmüyor; sonuçlar şüpheli olabilir.')
  }

  const full_name =
    parseApplicantFullName(text) ||
    parseApplicantFullName(noisyNormalizedText) ||
    parseApplicantNameFromGenderBlock(noisyNormalizedText) ||
    parseApplicantNameFromPassportContext(noisyNormalizedText) ||
    ''
  if (!full_name) warnings.push('Ad soyad otomatik bulunamadı.')

  const birth_year = parseBirthYear(text) || parseBirthYear(noisyNormalizedText)
  if (!birth_year) warnings.push('Doğum yılı bulunamadı.')

  const tc_number = parseTc(text) || parseTc(noisyNormalizedText) || ''
  if (!tc_number) warnings.push('TC / ulusal kimlik numarası bulunamadı.')

  const marital_status = parseMarital(text) || parseMarital(noisyNormalizedText) || 'Single'

  const { province: birth_province, city: birth_city } = parseBirthProvinceCity(mixedText)
  if (!birth_province) warnings.push('Doğum ili (eyalet) bulunamadı; PDF düzenine göre el ile girin.')
  if (!birth_city) warnings.push('Doğum ilçesi/şehir bulunamadı.')

  const passport_issue_place = parsePassportPlace(text) || parsePassportPlace(noisyNormalizedText) || ''
  if (!passport_issue_place) warnings.push('Pasaport veriliş yeri bulunamadı.')

  const home_address = parseHomeAddress(text) || parseHomeAddress(noisyNormalizedText) || ''
  const phone_number = parsePhone(text) || parsePhone(noisyNormalizedText) || ''
  const email = parseEmail(text) || parseEmail(noisyNormalizedText) || ''

  const fatherP = parseFather(text) || parseFather(noisyNormalizedText)
  const motherP = parseMother(text) || parseMother(noisyNormalizedText)
  const children = parseChildren(text).length ? parseChildren(text) : parseChildren(noisyNormalizedText)
  const fSplit = fatherP ? splitPersonName(fatherP.nameLine) : { first: '', last: '' }
  const mSplit = motherP ? splitPersonName(motherP.nameLine) : { first: '', last: '' }

  const workSection =
    text.match(/3\.2[\s\S]*?(?=四、|4\.|五、|5\.|Education)/i)?.[0] ||
    noisyNormalizedText.match(/3\.2[\s\S]*?(?=4\.|5\.|Education)/i)?.[0] ||
    text
  const work = parseWorkExperienceSection(workSection)

  const company_name = fixErdoGan(work.company_name || '')
  const address = fixErdoGan(work.address || '')

  const dutyUpper = (work.duty || '').toUpperCase().replace(/\s/g, '')
  const occupation_type: 'owner' | 'employee' =
    /OWNER|OWNE|BUSINESS|SELF|FOUNDER|PARTNER/i.test(dutyUpper) || /Businessperson/i.test(text)
      ? 'owner'
      : 'employee'

  const manager_name = work.managerLine ? fixErdoGan(normalizeSpaces(work.managerLine)) : full_name || ''

  const customer: Partial<PdfImportCustomer> = {
    full_name,
    birth_year: birth_year ?? undefined,
    birth_city: birth_city || undefined,
    birth_province: birth_province || undefined,
    tc_number,
    marital_status,
    passport_issue_place,
    home_address,
    phone_number,
    email,
    occupation_type,
    work_start_year: work.startYm?.y,
    work_start_month: work.startYm?.m,
    work_end_year: work.endYm?.y,
    work_end_month: work.endYm?.m,
    father_first_name: fSplit.first,
    father_last_name: fSplit.last,
    father_nationality: 'Türkiye',
    father_birth_date: fatherP?.birth || '',
    mother_first_name: mSplit.first,
    mother_last_name: mSplit.last,
    mother_nationality: 'Türkiye',
    mother_birth_date: motherP?.birth || '',
    children_count: children.length,
    children_data: children,
  }

  const turkishCompany: Partial<PdfImportTurkishCompany> = {
    company_name,
    address,
    phone: work.phone || phone_number,
    manager_name,
  }

  if (!company_name) warnings.push('Türk şirketi unvanı çıkarılamadı (Bölüm 3.2 iş deneyimi).')
  if (!turkishCompany.phone) warnings.push('Şirket telefonu bulunamadı.')

  const chineseInvite = parseChineseInvite(text)

  return { customer, turkishCompany, chineseInvite, warnings }
}
