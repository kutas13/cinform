import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

const IMAP_HOST = process.env.YUNAN_IMAP_HOST || 'imap.gmail.com'
const IMAP_PORT = parseInt(process.env.YUNAN_IMAP_PORT || '993')
const IMAP_USER = process.env.YUNAN_IMAP_USER || ''
const IMAP_PASS = process.env.YUNAN_IMAP_PASS || ''

interface MailCode {
  code: string
  tcLast2: string
  date: string
  subject: string
}

async function fetchLatestCodes(): Promise<MailCode[]> {
  if (!IMAP_USER || !IMAP_PASS) {
    throw new Error('IMAP bilgileri ayarlanmamis (YUNAN_IMAP_USER / YUNAN_IMAP_PASS)')
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  })

  const codes: MailCode[] = []

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      // Son 1 saat icindeki mailleri ara
      const since = new Date(Date.now() - 60 * 60 * 1000)

      const messages = client.fetch(
        { from: 'no-reply@kosmosvize.com', since },
        { envelope: true, source: true }
      )

      for await (const msg of messages) {
        const source = msg.source?.toString('utf-8') || ''
        const subject = msg.envelope?.subject || ''

        // "Mail doğrulama kodunuz:" veya "dogrulama kodunuz:" ara
        const codeMatch = source.match(/do[gğ]rulama\s+kodunuz[:\s]*(\d{4,8})/i)
          || source.match(/kodunuz[:\s]*(\d{4,8})/i)

        // "Kimlik Numarası:" veya "Kimlik Numarasi:" ara
        const tcMatch = source.match(/Kimlik\s+Numaras[ıi][:\s]*(\d{2,11})/i)

        if (codeMatch) {
          codes.push({
            code: codeMatch[1],
            tcLast2: tcMatch ? tcMatch[1] : '',
            date: msg.envelope?.date?.toISOString() || '',
            subject,
          })
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (e: any) {
    await client.close().catch(() => {})
    throw new Error('IMAP baglanti hatasi: ' + e.message)
  }

  // En yeniden eskiye sirala
  codes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return codes
}

export async function GET(req: NextRequest) {
  const tcLast2 = req.nextUrl.searchParams.get('tc_last2')

  if (!tcLast2) {
    return NextResponse.json({ error: 'tc_last2 parametresi gerekli' }, { status: 400 })
  }

  try {
    const codes = await fetchLatestCodes()

    // TC son 2 haneye gore eslesir
    const match = codes.find(c => c.tcLast2 === tcLast2 || c.tcLast2.endsWith(tcLast2))

    if (match) {
      return NextResponse.json({
        success: true,
        code: match.code,
        tcLast2: match.tcLast2,
        date: match.date,
      })
    }

    return NextResponse.json({
      success: false,
      message: `TC sonu ${tcLast2} icin kod bulunamadi`,
      totalFound: codes.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
