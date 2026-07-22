import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  TabStopType, TabStopPosition, BorderStyle,
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

    const FONT = 'Times New Roman'
    const SIZE = 24

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
          },
        },
        children: [
          // Tarih (sag hizali)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: todayTR(), font: FONT, size: SIZE }),
            ],
          }),

          // Baslık
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'Çin Halk Cumhuriyeti İstanbul Başkonsolosluğu', font: FONT, size: SIZE, bold: true }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "Vize Bölümü'ne,", font: FONT, size: SIZE, bold: true }),
            ],
          }),

          // Ana metin
          new Paragraph({
            spacing: { after: 100 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: 'Aşağıda bilgileri verilen kadrolu şirket personelimize, ülkenize yapacağı seyahat için gerekli olan vizenin verilmesini rica ederiz.',
                font: FONT, size: SIZE,
              }),
            ],
          }),

          // Yetkili bilgileri (sag tarafa yaslı)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200 },
            children: [
              new TextRun({ text: 'Yetkili Adı Soyadı: ', font: FONT, size: SIZE }),
              new TextRun({ text: fullName, font: FONT, size: SIZE, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Görevi: ', font: FONT, size: SIZE }),
              new TextRun({ text: 'GENEL MÜDÜR', font: FONT, size: SIZE, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'İmza:', font: FONT, size: SIZE }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [
              new TextRun({ text: 'Kaşe:', font: FONT, size: SIZE }),
            ],
          }),

          // Separator
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' } },
            spacing: { after: 200 },
            children: [],
          }),

          // Kisi bilgileri baslik
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({ text: "Çin'e Gidecek Kişi ile İlgili Bilgiler:", font: FONT, size: SIZE, bold: true, underline: {} }),
            ],
          }),

          // Kisi bilgileri
          ...createInfoLine('Adı Soyadı', fullName, FONT, SIZE),
          ...createInfoLine('Pasaport No', passportNo, FONT, SIZE),
          ...createInfoLine('Görevi / Mesleği', 'GENEL MÜDÜR', FONT, SIZE),
          ...createInfoLine('Ulaşılabilir Cep No', phone, FONT, SIZE),

          // Separator
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' } },
            spacing: { before: 100, after: 200 },
            children: [],
          }),

          // Seyahat bilgileri baslik
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Seyahat Bilgileri:', font: FONT, size: SIZE, bold: true, underline: {} }),
            ],
          }),

          ...createInfoLine('Gidiş – Dönüş Tarihleri', `${startDate} – ${endDate}`, FONT, SIZE),
          ...createInfoLine('Ziyaret Amacı', 'TİCARİ', FONT, SIZE),
          ...createInfoLine('Ziyaret Edilecek Şehirler', visitCity, FONT, SIZE),

          // Separator
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' } },
            spacing: { before: 100, after: 200 },
            children: [],
          }),

          // Gonderici firma baslik
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Gönderici Firma ile İlgili Bilgiler:', font: FONT, size: SIZE, bold: true, underline: {} }),
            ],
          }),

          ...createInfoLine('Firma Adı', turkCompany, FONT, SIZE),
          ...createInfoLine('Ulaşılabilir Tel No', phone, FONT, SIZE),

          // Separator
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' } },
            spacing: { before: 100, after: 200 },
            children: [],
          }),

          // Cinli firma baslik
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Çin'de Ziyaret Edilecek Firma ile İlgili Bilgiler:", font: FONT, size: SIZE, bold: true, underline: {} }),
            ],
          }),

          ...createInfoLine('Firma / Fuar Adı', chinCompany, FONT, SIZE),
          ...createInfoLine('Ulaşılabilir Tel No', chinPhone, FONT, SIZE),

          // Separator
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' } },
            spacing: { before: 100, after: 200 },
            children: [],
          }),

          // NOT
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: 'NOT: ', font: FONT, size: SIZE, bold: true }),
              new TextRun({
                text: 'Seyahat sebebiyle oluşabilecek masraflar, şirketimiz tarafından karşılanacak olup; söz konusu kişinin vize süresi bitiminden önce geri döneceğini taahhüt ederiz.',
                font: FONT, size: SIZE,
              }),
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

function createInfoLine(label: string, value: string, font: string, size: number): Paragraph[] {
  return [
    new Paragraph({
      spacing: { after: 80 },
      indent: { left: 360 },
      children: [
        new TextRun({ text: `${label}`, font, size, bold: true }),
        new TextRun({ text: `\t: `, font, size }),
        new TextRun({ text: value, font, size }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: TabStopPosition.MAX * 0.35 },
      ],
    }),
  ]
}
