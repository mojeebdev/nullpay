import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    const appId = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authHeader = 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const payload = JSON.stringify({
      wallets: [{ chain_type: 'ethereum', owner: { user_id: userId } }]
    })

    // 🛑 Emergency Bypass: Use HTTPS module directly to avoid Node 'fetch failed'
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.privy.io',
        path: `/v1/users/${userId}/wallets`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'privy-app-id': appId,
          'Content-Length': payload.length
        }
      }

      const request = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }))
      })

      request.on('error', (err) => reject(err))
      request.write(payload)
      request.end()
    }) as any;

    if (result.status >= 400) {
      return NextResponse.json(result.data, { status: result.status })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (err: any) {
    console.error('FINAL ATTEMPT ERROR:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
