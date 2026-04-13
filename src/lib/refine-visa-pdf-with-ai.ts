import type { ChinaVisaPdfParseResult } from '@/lib/parse-china-visa-pdf'

type AiRefineResult = {
  customer?: Record<string, unknown>
  turkishCompany?: Record<string, unknown>
  warnings?: string[]
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

export async function refineVisaPdfWithAi(
  rawPdfText: string,
  parsed: ChinaVisaPdfParseResult,
  apiKey: string
): Promise<ChinaVisaPdfParseResult> {
  const prompt = `You are extracting structured data from a China Visa Application PDF text.
Return ONLY a JSON object with this shape:
{
  "customer": {
    "marital_status": "Single|Married|Divorced|Widowed|Other",
    "birth_city": "string",
    "birth_province": "string",
    "email": "string",
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
- Prefer already parsed values if uncertain.
- Fix OCR splits like "T urk iye" or "Please specify" noise.
- If spouse data exists, marital_status should be Married.
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
  const data = (await res.json()) as { output_text?: string }
  const raw = data.output_text || ''
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
