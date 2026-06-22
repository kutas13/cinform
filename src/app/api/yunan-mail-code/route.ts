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

function extractCode(text: string, tcLast2: string): MailCode | null {
  const codeMatch =
    text.match(/do[g\u011F]rulama\s+kodunuz[:\s]*(\d{4,8})/i) ||
    text.match(/kodunuz[:\s]+(\d{4,8})/i) ||
    text.match(/kod[u\s]*[:\s]+(\d{4,8})/i) ||
    text.match(/code[:\s]+(\d{4,8})/i) ||
    text.match(/\b(\d{6})\b/)

  if (!codeMatch) return null

  const tcMatch = text.match(/Kimlik\s*Numaras[\u0131i][:\s]*(\d{2,11})/i)
  const mailTc = tcMatch ? tcMatch[1] : ''

  return { code: codeMatch[1], tcLast2: mailTc, date: new Date().toISOString() }
}

async function checkMailsOnce(
  client: ImapFlow,
  sinceTime: Date,
  tcLast2: string,
  lastCheckedUid: number
): Promise<{ match: MailCode | null; maxUid: number; debug: string }> {
  const debugParts: string[] = []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const uids = await client.search({ since: todayStart })
  const uidList: number[] = Array.isArray(uids)
    ? uids
    : (uids as any) ? [...(uids as any)] : []

  if (uidList.length === 0) return { match: null, maxUid: lastCheckedUid, debug: 'no uids' }

  // Sadece yeni mailleri kontrol et
  const newUids = lastCheckedUid > 0
    ? uidList.filter(u => u > lastCheckedUid)
    : uidList.slice(-10)

  const currentMax = Math.max(...uidList)

  if (newUids.length === 0) return { match: null, maxUid: currentMax, debug: 'no new mails' }

  debugParts.push(`${newUids.length} new mail(s)`)

  const messages = client.fetch(newUids, { envelope: true, source: true, uid: true })

  let bestMatch: MailCode | null = null

  for await (const msg of messages) {
    const subject = msg.envelope?.subject || ''
    const subjectLower = subject.toLowerCase()

    const isRelevant =
      subjectLower.includes('do\u011Frulama') ||
      subjectLower.includes('dogrulama') ||
      subjectLower.includes('verification') ||
      subjectLower.includes('kod') ||
      subjectLower.includes('code') ||
      subjectLower.includes('kosmos')
    if (!isRelevant) continue
    if (!msg.source) continue

    debugParts.push(`found: "${subject.substring(0, 40)}"`)

    let text = ''
    try {
      const parsed = await simpleParser(msg.source as any)
      text = parsed.text || ''
      if (!text && parsed.html) {
        text = parsed.html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
      }
    } catch {
      text = msg.source.toString('utf-8')
    }

    const result = extractCode(text, tcLast2)
    if (result) {
      debugParts.push(`code=${result.code}, tc=${result.tcLast2}`)
      if (result.tcLast2 === tcLast2 || result.tcLast2.endsWith(tcLast2)) {
        return { match: result, maxUid: currentMax, debug: debugParts.join(' | ') }
      }
      bestMatch = result
    }
  }

  if (bestMatch) {
    debugParts.push('tc mismatch, returning best match')
    return { match: bestMatch, maxUid: currentMax, debug: debugParts.join(' | ') }
  }

  return { match: null, maxUid: currentMax, debug: debugParts.join(' | ') }
}

async function waitForCode(
  sinceTime: Date,
  tcLast2: string,
  timeoutMs: number
): Promise<{ match: MailCode | null; debug: string }> {
  if (!IMAP_USER || !IMAP_PASS) throw new Error('IMAP bilgileri ayarlanmamis')

  const allDebug: string[] = []
  const deadline = Date.now() + timeoutMs

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
    greetingTimeout: 8000,
    socketTimeout: 60000,
  } as any)

  try {
    await client.connect()
    allDebug.push('connected')
    const lock = await client.getMailboxLock('INBOX')

    try {
      let lastUid = 0

      // Ilk kontrol - mevcut maillerde var mi?
      const first = await checkMailsOnce(client, sinceTime, tcLast2, 0)
      lastUid = first.maxUid
      allDebug.push(`init: ${first.debug}`)
      if (first.match) return { match: first.match, debug: allDebug.join(' || ') }

      // Yoksa bekle ve tekrar kontrol et - her 1sn
      let round = 0
      while (Date.now() < deadline) {
        round++
        await new Promise(r => setTimeout(r, 1000))

        const result = await checkMailsOnce(client, sinceTime, tcLast2, lastUid)
        lastUid = result.maxUid
        if (result.debug !== 'no new mails') {
          allDebug.push(`r${round}: ${result.debug}`)
        }
        if (result.match) return { match: result.match, debug: allDebug.join(' || ') }
      }

      allDebug.push('timeout')
      return { match: null, debug: allDebug.join(' || ') }
    } finally {
      lock.release()
    }
  } finally {
    try { await client.logout() } catch {}
  }
}

export async function GET(req: NextRequest) {
  const tcLast2 = req.nextUrl.searchParams.get('tc_last2')
  const sinceParam = req.nextUrl.searchParams.get('since')
  const timeoutParam = req.nextUrl.searchParams.get('timeout')

  if (!tcLast2) {
    return NextResponse.json({ error: 'tc_last2 parametresi gerekli' }, { status: 400 })
  }

  const sinceTime = sinceParam
    ? new Date(isNaN(Number(sinceParam)) ? sinceParam : Number(sinceParam))
    : new Date(Date.now() - 5 * 60 * 1000)

  // Default 50sn bekle, max 55sn
  const timeout = Math.min(parseInt(timeoutParam || '50000'), 55000)

  try {
    const { match, debug } = await waitForCode(sinceTime, tcLast2, timeout)
    console.log('[yunan-mail-code]', debug)

    if (match) {
      return NextResponse.json({ success: true, code: match.code, tcLast2: match.tcLast2, date: match.date })
    }

    return NextResponse.json({ success: false, message: `Kod bulunamadi (${timeout / 1000}sn beklendi)`, debug })
  } catch (e: any) {
    console.error('[yunan-mail-code] ERROR:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
