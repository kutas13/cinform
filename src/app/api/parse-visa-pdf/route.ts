import { NextResponse } from 'next/server'
import { refineVisaPdfWithAi } from '@/lib/refine-visa-pdf-with-ai'
import { parseChinaVisaPdfText } from '@/lib/parse-china-visa-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Vercel Pro+: daha büyük PDF’ler için. Hobby’de üst sınır ~10s olabilir. */
export const maxDuration = 60

const MAX_BYTES = 12 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const ct = request.headers.get('content-type') || ''
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'multipart/form-data bekleniyor' }, { status: 400 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'file alanı gerekli' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'PDF en fazla 12 MB olabilir' }, { status: 413 })
    }

    const name = 'name' in file && typeof file.name === 'string' ? file.name : ''
    if (name && !name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Yalnızca .pdf dosyası yükleyin' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer)
    const text = result.text || ''

    if (!text || text.trim().length < 80) {
      return NextResponse.json(
        {
          error:
            'PDF içinde okunabilir metin bulunamadı. Taranmış (görüntü) PDF’ler desteklenmez; metin katmanı olan form kullanın.',
        },
        { status: 422 }
      )
    }

    let parsed = parseChinaVisaPdfText(text)
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        parsed = await refineVisaPdfWithAi(text, parsed, apiKey)
      } catch (aiError) {
        console.error('[parse-visa-pdf][ai-refine-fallback-regex]', aiError)
        parsed.warnings = [...(parsed.warnings || []), 'AI adımı başarısız oldu; regex sonucu kullanıldı.']
      }
    } else {
      parsed.warnings = [...(parsed.warnings || []), 'OPENAI_API_KEY bulunamadı; regex sonucu kullanıldı.']
    }

    return NextResponse.json(parsed)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Bilinmeyen hata'
    console.error('[parse-visa-pdf]', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
