import type { ChinaVisaPdfParseResult } from '@/lib/parse-china-visa-pdf'

type AiRefineResult = {
  customer?: Record<string, unknown>
  turkishCompany?: Record<string, unknown>
  warnings?: string[]
}

type ResponsesApiPayload = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

function pickString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s ? s : undefined
}

function pickNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return undefined
}

function extractJsonObject(text: string): AiRefineResult | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as AiRefineResult
  } catch {
    return null
  }
}

function extractModelText(data: ResponsesApiPayload): string {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text
  const pieces: string[] = []
  for (const item of data.output || []) {
    for (const part of item.content || []) {
      if (typeof part.text === 'string' && part.text.trim()) pieces.push(part.text)
    }
  }
  return pieces.join('\n')
}

export async function refineVisaPdfWithAi(
  rawPdfText: string,
  parsed: ChinaVisaPdfParseResult,
  apiKey: string
): Promise<ChinaVisaPdfParseResult> {
  const prompt = `You are extracting structured data from a China Visa Application PDF text.
Return ONLY a JSON object with this shape:
{
  "customer": {
    "full_name": "string",
    "birth_year": number,
    "marital_status": "Single|Married|Divorced|Widowed|Other",
    "birth_city": "string",
    "birth_province": "string",
    "tc_number": "string",
    "passport_issue_place": "string",
    "home_address": "string",
    "phone_number": "string",
    "email": "string",
    "occupation_type": "owner|employee",
    "work_start_year": number,
    "work_start_month": number,
    "work_end_year": number,
    "work_end_month": number,
    "father_first_name": "string",
    "father_last_name": "string",
    "father_nationality": "string",
    "father_birth_date": "yyyy-mm-dd",
    "mother_first_name": "string",
    "mother_last_name": "string",
    "mother_nationality": "string",
    "mother_birth_date": "yyyy-mm-dd",
    "spouse_first_name": "string",
    "spouse_last_name": "string",
    "spouse_birth_date": "yyyy-mm-dd",
    "spouse_birth_country": "string",
    "spouse_birth_city": "string",
    "children_count": number,
    "children_data": [{"first_name":"string","last_name":"string","nationality":"string","birth_date":"yyyy-mm-dd"}]
  },
  "turkishCompany": {
    "company_name": "string",
    "address": "string",
    "phone": "string",
    "manager_name": "string"
  },
  "warnings": ["string"]
}

Rules:
- Parse directly from PDF text. Extract ALL fields accurately.
- Fix OCR splits like "T urk iye", "BO ZACI" -> "BOZACI", "O MER" -> "OMER".
- Section 5.5A contains Spouse data. Extract name, birth date, birth country, birth city.
- If spouse data exists, marital_status MUST be "Married".
- Section 5.5B=Father, 5.5C=Mother, 5.5D=Children.
- Section 3.2 has work experience with Turkish company info.
- birth_province and birth_city come from section 1.4B and 1.4C, NOT "Please specify".
- passport_issue_place comes from section 1.7D.
- Keep output concise and valid JSON only.`

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: prompt }] },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Existing parsed JSON:\n${JSON.stringify(parsed)}\n\nRaw PDF text:\n${rawPdfText.slice(0, 22000)}`,
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) return parsed
  const data = (await res.json()) as ResponsesApiPayload
  const raw = extractModelText(data)
  const ai = extractJsonObject(raw)
  if (!ai) return parsed

  const merged: ChinaVisaPdfParseResult = {
    customer: { ...parsed.customer },
    turkishCompany: { ...parsed.turkishCompany },
    chineseInvite: parsed.chineseInvite,
    warnings: [...(parsed.warnings || [])],
  }

  if (ai.customer) {
    const c = ai.customer
    const fullName = pickString(c.full_name)
    if (fullName) merged.customer.full_name = fullName
    const birthYear = pickNumber(c.birth_year)
    if (birthYear !== undefined) merged.customer.birth_year = birthYear
    const marital = pickString(c.marital_status)
    if (marital && ['Single', 'Married', 'Divorced', 'Widowed', 'Other'].includes(marital)) {
      merged.customer.marital_status = marital as any
    }
    const birthCity = pickString(c.birth_city)
    if (birthCity && !/^please\s*specify$/i.test(birthCity)) merged.customer.birth_city = birthCity
    const birthProvince = pickString(c.birth_province)
    if (birthProvince) merged.customer.birth_province = birthProvince
    const email = pickString(c.email)
    if (email) merged.customer.email = email
    const tc = pickString(c.tc_number)
    if (tc) merged.customer.tc_number = tc
    const issuePlace = pickString(c.passport_issue_place)
    if (issuePlace) merged.customer.passport_issue_place = issuePlace
    const homeAddress = pickString(c.home_address)
    if (homeAddress) merged.customer.home_address = homeAddress
    const phoneNumber = pickString(c.phone_number)
    if (phoneNumber) merged.customer.phone_number = phoneNumber
    const occupationType = pickString(c.occupation_type)
    if (occupationType === 'owner' || occupationType === 'employee') {
      merged.customer.occupation_type = occupationType
    }
    const workStartYear = pickNumber(c.work_start_year)
    if (workStartYear !== undefined) merged.customer.work_start_year = workStartYear
    const workStartMonth = pickNumber(c.work_start_month)
    if (workStartMonth !== undefined) merged.customer.work_start_month = workStartMonth
    const workEndYear = pickNumber(c.work_end_year)
    if (workEndYear !== undefined) merged.customer.work_end_year = workEndYear
    const workEndMonth = pickNumber(c.work_end_month)
    if (workEndMonth !== undefined) merged.customer.work_end_month = workEndMonth
    const fatherFirstName = pickString(c.father_first_name)
    if (fatherFirstName) merged.customer.father_first_name = fatherFirstName
    const fatherLastName = pickString(c.father_last_name)
    if (fatherLastName) merged.customer.father_last_name = fatherLastName
    const fatherNationality = pickString(c.father_nationality)
    if (fatherNationality) merged.customer.father_nationality = fatherNationality
    const fatherBirthDate = pickString(c.father_birth_date)
    if (fatherBirthDate) merged.customer.father_birth_date = fatherBirthDate
    const motherFirstName = pickString(c.mother_first_name)
    if (motherFirstName) merged.customer.mother_first_name = motherFirstName
    const motherLastName = pickString(c.mother_last_name)
    if (motherLastName) merged.customer.mother_last_name = motherLastName
    const motherNationality = pickString(c.mother_nationality)
    if (motherNationality) merged.customer.mother_nationality = motherNationality
    const motherBirthDate = pickString(c.mother_birth_date)
    if (motherBirthDate) merged.customer.mother_birth_date = motherBirthDate
    const spouseFirstName = pickString(c.spouse_first_name)
    if (spouseFirstName) merged.customer.spouse_first_name = spouseFirstName
    const spouseLastName = pickString(c.spouse_last_name)
    if (spouseLastName) merged.customer.spouse_last_name = spouseLastName
    const spouseBirthDate = pickString(c.spouse_birth_date)
    if (spouseBirthDate) merged.customer.spouse_birth_date = spouseBirthDate
    const spouseBirthCountry = pickString(c.spouse_birth_country)
    if (spouseBirthCountry) merged.customer.spouse_birth_country = spouseBirthCountry
    const spouseBirthCity = pickString(c.spouse_birth_city)
    if (spouseBirthCity) merged.customer.spouse_birth_city = spouseBirthCity

    const childrenCount = pickNumber(c.children_count)
    if (childrenCount !== undefined) merged.customer.children_count = childrenCount
    if (Array.isArray(c.children_data)) {
      const children = c.children_data
        .map((row) => (typeof row === 'object' && row ? (row as Record<string, unknown>) : null))
        .filter(Boolean)
        .map((row) => ({
          first_name: pickString((row as Record<string, unknown>).first_name) || '',
          last_name: pickString((row as Record<string, unknown>).last_name) || '',
          nationality: pickString((row as Record<string, unknown>).nationality) || 'Türkiye',
          birth_date: pickString((row as Record<string, unknown>).birth_date) || '',
        }))
        .filter((x) => x.first_name && x.last_name)
      if (children.length > 0) {
        merged.customer.children_data = children
        merged.customer.children_count = children.length
      }
    }
  }

  if (ai.turkishCompany) {
    const t = ai.turkishCompany
    const companyName = pickString(t.company_name)
    if (companyName) merged.turkishCompany.company_name = companyName
    const address = pickString(t.address)
    if (address) merged.turkishCompany.address = address
    const phone = pickString(t.phone)
    if (phone) merged.turkishCompany.phone = phone
    const manager = pickString(t.manager_name)
    if (manager) merged.turkishCompany.manager_name = manager
  }

  if (Array.isArray(ai.warnings)) {
    for (const w of ai.warnings) {
      if (typeof w === 'string' && w.trim()) merged.warnings.push(w.trim())
    }
  }

  return merged
}
