import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  TabStopType, convertMillimetersToTwip,
} from 'docx'

export const dynamic = 'force-dynamic'

function formatDateTR(dateStr: string): string {
  if (!dateStr) return '../../....'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function todayTR(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

const FONT = 'Times New Roman'
const SZ = 22

function txt(text: string, bold = false): TextRun {
  return new TextRun({ text, font: FONT, size: SZ, bold })
}

function infoLine(label: string, value: string): Paragraph {
  const padded = label.padEnd(30, ' ')
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: convertMillimetersToTwip(5) },
    tabStops: [{ type: TabStopType.LEFT, position: convertMillimetersToTwip(70) }],
    children: [
      new TextRun({ text: padded, font: FONT, size: SZ }),
      new TextRun({ text: `:${value}`, font: FONT, size: SZ }),
    ],
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text, font: FONT, size: SZ, bold: true, underline: {} }),
    ],
  })
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 40 }, children: [] })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: form, error: formError } = await supabase
      .from('forms').select('*').eq('access_token', token).single()
    if (formError || !form) {
      return NextResponse.json({ error: 'Form bulunamadi' }, { status: 404 })
    }

    const [custRes, chinRes, turkRes] = await Promise.all([
      supabase.from('customers').select('*').eq('id', form.customer_id).single(),
      supabase.from('chinese_companies').select('*').eq('id', form.chinese_company_id).single(),
      supabase.from('turkish_companies').select('*').eq('id', form.turkish_company_id).single(),
    ])

    const customer = custRes.data as any
    const chinese = chinRes.data as any
    const turkish = turkRes.data as any

    if (!customer || !chinese || !turkish) {
      return NextResponse.json({ error: 'Ilgili veriler bulunamadi' }, { status: 404 })
    }

    const fullName = (customer.full_name || '').toUpperCase()
    const passportNo = customer.passport_number || '...............'
    const phone = customer.phone_number || '...............'
    const startDate = formatDateTR(form.travel_start_date)
    const endDate = formatDateTR(form.travel_end_date)
    const turkCompany = (turkish.company_name || '').toUpperCase()
    const chinCompany = (chinese.company_name || '').toUpperCase()
    const chinPhone = chinese.phone || '...............'
    const chinCity = (chinese.city || '').toUpperCase()
    const chinDistrict = (chinese.district || '').toUpperCase()
    const visitCity = chinDistrict ? `${chinCity} (${chinDistrict})` : chinCity

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 800, bottom: 800, left: 1200, right: 1000 },
          },
        },
        children: [
          // Tarih (sag hizali)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [txt(todayTR())],
          }),

          emptyLine(),

          // Baslik
          new Paragraph({
            spacing: { after: 20 },
            children: [txt('Çin Halk Cumhuriyeti İstanbul Başkonsolosluğu', true)],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [txt("Vize Bölümü`ne,", true)],
          }),

          // Ana metin
          new Paragraph({
            spacing: { after: 60 },
            indent: { firstLine: convertMillimetersToTwip(12) },
            children: [
              txt('Aşağıda bilgileri verilen kadrolu şirket personelimize, ülkenize yapacağı seyahat için gerekli olan vizenin verilmesini rica ederiz.'),
            ],
          }),

          // Yetkili bilgileri (sag tarafa)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 20 },
            children: [
              txt('Yetkili Adı Soyadı: '),
              txt(fullName, true),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 20 },
            children: [
              txt('Görevi: '),
              txt('GENEL MÜDÜR', true),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 20 },
            children: [txt('İmza:')],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
            children: [txt('Kaşe:')],
          }),

          // Kisi bilgileri
          sectionHeader("Çin`e Gidecek Kişi ile İlgili Bilgiler:"),
          infoLine('Adı Soyadı', fullName),
          infoLine('Pasaport No', passportNo),
          infoLine('Görevi / Mesleği', 'GENEL MÜDÜR'),
          infoLine('Ulaşılabilir Cep No', phone),

          // Seyahat bilgileri
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [txt('Seyahat Bilgileri:', true)],
          }),
          infoLine('Gidiş – Dönüş Tarihleri', `${startDate} –${endDate}`),
          infoLine('Ziyaret Amacı', 'TİCARİ'),
          infoLine('Ziyaret Edilecek Şehirler', visitCity),

          // Gonderici firma
          sectionHeader('Gönderici Firma ile İlgili Bilgiler:'),
          infoLine('Firma Adı', turkCompany),
          infoLine('Ulaşılabilir Tel No', phone),

          // Cinli firma
          sectionHeader("Çin`de Ziyaret Edilecek Firma ile İlgili Bilgiler:"),
          infoLine('Firma / Fuar Adı', chinCompany),
          infoLine('Ulaşılabilir Tel No', chinPhone),

          // NOT
          new Paragraph({
            spacing: { before: 200 },
            children: [
              txt('NOT: ', true),
              txt('Seyahat sebebiyle oluşabilecek  masraflar, şirketimiz tarafından karşılanacak olup; söz konusu kişinin vize süresi bitiminden önce geri döneceğini taahhüt ederiz.'),
            ],
          }),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Dilekce_${fullName.replace(/\s+/g, '_')}.docx"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error: any) {
    console.error('Dilekce API Error:', error)
    return NextResponse.json(
      { error: 'Dilekce olusturulamadi: ' + (error.message || '') },
      { status: 500 }
    )
  }
}
