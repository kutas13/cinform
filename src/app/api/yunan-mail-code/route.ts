import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

const IMAP_HOST = process.env.YUNAN_IMAP_HOST || 'imap.yandex.com'
const IMAP_PORT = parseInt(process.env.YUNAN_IMAP_PORT || '993')
const IMAP_USER = process.env.YUNAN_IMAP_USER || 'vize@foxturizm.com'
const IMAP_PASS = process.env.YUNAN_IMAP_PASS || ''

interface MailCode {
  code: string
  tcLast2: string
  date: string
}

async function fetchCodesSince(
  sinceTime: Date,
  tcLast2: string
): Promise<MailCode | null> {
  if (!IMAP_USER || !IMAP_PASS) {
    throw new Error('IMAP bilgileri ayarlanmamis')
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  } as any)

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const uids = await client.search({ since: sinceTime })
      const uidList: number[] = Array.isArray(uids)
        ? uids
        : (uids as any)
          ? [...(uids as any)]
          : []

      if (uidList.length === 0) return null

      // Son 50 mail yeterli
      const recentUids = uidList.slice(-50)

      const messages = client.fetch(recentUids, {
        envelope: true,
        source: true,
      })

      const codes: MailCode[] = []

      for await (const msg of messages) {
        const subject = msg.envelope?.subject || ''
        const msgDate = msg.envelope?.date

        // Sadece Kosmos dogrulama kodlari
        const subjectLower = subject.toLowerCase()
        const isVerification =
          subjectLower.includes('do\u011Frulama') ||
          subjectLower.includes('dogrulama') ||
          subjectLower.includes('verification') ||
          (subjectLower.includes('kosmos') && subjectLower.includes('kod'))
        if (!isVerification) continue
        if (subjectLower.includes('randevu')) continue

        // Zaman kontrolu
        if (msgDate && msgDate.getTime() < sinceTime.getTime()) continue

        // mailparser ile duzgun decode
        if (!msg.source) continue
        const parsed = await simpleParser(msg.source as any)
        const text = parsed.text || ''

        // "Mail doğrulama kodunuz: 972189"
        const codeMatch =
          text.match(/do[g\u011F]rulama\s+kodunuz[:\s]*(\d{4,8})/i) ||
          text.match(/kodunuz[:\s]+(\d{4,8})/i)

        // "Kimlik Numarası:\n00"
        const tcMatch = text.match(
          /Kimlik\s+Numaras[\u0131i][:\s]*(\d{2,11})/i
        )

        if (codeMatch) {
          codes.push({
            code: codeMatch[1],
            tcLast2: tcMatch ? tcMatch[1] : '',
            date: msgDate?.toISOString() || '',
          })
        }
      }

      codes.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      return (
        codes.find(
          (c) => c.tcLast2 === tcLast2 || c.tcLast2.endsWith(tcLast2)
        ) || null
      )
    } finally {
      lock.release()
    }
  } finally {
    try {
      await client.logout()
    } catch {}
  }
}

export async function GET(req: NextRequest) {
  const tcLast2 = req.nextUrl.searchParams.get('tc_last2')
  const sinceParam = req.nextUrl.searchParams.get('since')

  if (!tcLast2) {
    return NextResponse.json(
      { error: 'tc_last2 parametresi gerekli' },
      { status: 400 }
    )
  }

  const sinceTime = sinceParam
    ? new Date(
        isNaN(Number(sinceParam)) ? sinceParam : Number(sinceParam)
      )
    : new Date(Date.now() - 5 * 60 * 1000)

  try {
    const match = await fetchCodesSince(sinceTime, tcLast2)

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
    })
  } catch (e: any) {
    console.error('[yunan-mail-code]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
