import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  TabStopType, convertMillimetersToTwip,
} from 'docx'

export const dynamic = 'force-dynamic'

function fmtDate(dateStr: string): string {
  if (!dateStr) return '../../....'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function today(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

const F = 'Times New Roman'
const S = 22
const TAB_POS = convertMillimetersToTwip(65)

function r(text: string, bold = false): TextRun {
  return new TextRun({ text, font: F, size: S, bold })
}

function line(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 30 },
    indent: { left: convertMillimetersToTwip(5) },
    tabStops: [{ type: TabStopType.LEFT, position: TAB_POS }],
    children: [
      r(label),
      new TextRun({ text: '\t', font: F, size: S }),
      r(':' + value),
    ],
  })
}

function header(text: string, underline = true): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({ text, font: F, size: S, bold: true, underline: underline ? {} : undefined }),
    ],
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: form, error: fe } = await supabase
      .from('forms').select('*').eq('access_token', token).single()
    if (fe || !form) return NextResponse.json({ error: 'Form bulunamadi' }, { status: 404 })

    const [cu, ch, tu] = await Promise.all([
      supabase.from('customers').select('*').eq('id', form.customer_id).single(),
      supabase.from('chinese_companies').select('*').eq('id', form.chinese_company_id).single(),
      supabase.from('turkish_companies').select('*').eq('id', form.turkish_company_id).single(),
    ])
    const c = cu.data as any, cn = ch.data as any, tr = tu.data as any
    if (!c || !cn || !tr) return NextResponse.json({ error: 'Veriler bulunamadi' }, { status: 404 })

    const name = (c.full_name || '').toUpperCase()
    const pp = c.passport_number || '...............'
    const tel = c.phone_number || '...............'
    const d1 = fmtDate(form.travel_start_date)
    const d2 = fmtDate(form.travel_end_date)
    const trk = (tr.company_name || '').toUpperCase()
    const chn = (cn.company_name || '').toUpperCase()
    const ctel = cn.phone || '...............'
    const city = (cn.city || '').toUpperCase()
    const dist = (cn.district || '').toUpperCase()
    const visit = dist ? `${city} (${dist})` : city

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 800, bottom: 800, left: 1200, right: 1000 } },
        },
        children: [
          // Tarih
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
            children: [r(today())],
          }),

          // Baslik
          new Paragraph({ children: [r('Çin Halk Cumhuriyeti İstanbul Başkonsolosluğu', true)] }),
          new Paragraph({
            spacing: { after: 100 },
            children: [r("Vize Bölümü`ne,", true)],
          }),

          // Metin
          new Paragraph({
            spacing: { after: 40 },
            indent: { firstLine: convertMillimetersToTwip(13) },
            children: [r('Aşağıda bilgileri verilen kadrolu şirket personelimize, ülkenize yapacağı seyahat için gerekli olan vizenin verilmesini rica ederiz.')],
          }),

          // Yetkili (sag)
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 100 }, children: [r('Yetkili Adı Soyadı: ' + name)] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [r('Görevi: GENEL MÜDÜR')] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [r('İmza:')] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 160 }, children: [r('Kaşe:')] }),

          // Kisi
          header("Çin`e Gidecek Kişi ile İlgili Bilgiler:"),
          line('Adı Soyadı', name),
          line('Pasaport No', pp),
          line('Görevi / Mesleği', ' GENEL MÜDÜR'),
          line('Ulaşılabilir Cep No', ' ' + tel),

          // Seyahat
          header('Seyahat Bilgileri:', false),
          line('Gidiş – Dönüş Tarihleri', ' ' + d1 + ' –' + d2),
          line('Ziyaret Amacı', 'TİCARİ'),
          line('Ziyaret Edilecek Şehirler', visit),

          // Gonderici
          header('Gönderici Firma ile İlgili Bilgiler:'),
          line('Firma Adı', ' ' + trk),
          line('Ulaşılabilir Tel No', ' ' + tel),

          // Cinli
          header("Çin`de Ziyaret Edilecek Firma ile İlgili Bilgiler:"),
          line('Firma / Fuar Adı', ' ' + chn),
          line('Ulaşılabilir Tel No', ' ' + ctel),

          // NOT
          new Paragraph({
            spacing: { before: 180 },
            children: [
              r('NOT: ', true),
              r('Seyahat sebebiyle oluşabilecek  masraflar, şirketimiz tarafından karşılanacak olup; söz konusu kişinin vize süresi bitiminden önce geri döneceğini taahhüt ederiz.'),
            ],
          }),
        ],
      }],
    })

    const buf = await Packer.toBuffer(doc)

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Dilekce_${name.replace(/\s+/g,'_')}.docx"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e: any) {
    console.error('Dilekce Error:', e)
    return NextResponse.json({ error: e.message || 'Hata' }, { status: 500 })
  }
}
