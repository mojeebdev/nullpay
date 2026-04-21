import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { walletId, hash } = body

    if (!walletId || !hash) {
      return NextResponse.json({ error: 'Missing walletId or hash' }, { status: 400 })
    }

    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!

    const url = `https://auth.privy.io/api/v1/wallets/${walletId}/rpc`

    const requestBody = JSON.stringify({
      method: 'secp256k1_sign',
      params: { hash },
    })

    // Generate authorization signature
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const method = 'POST'
    const path = `/api/v1/wallets/${walletId}/rpc`
    const payload = `${timestamp}:${method}:${path}:${requestBody}`
    const signature = createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
        'privy-authorization-signature': `t=${timestamp},s=${signature}`,
      },
      body: requestBody,
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Privy sign error:', data)
      return NextResponse.json({ error: data.message || data.error || 'Signing failed' }, { status: res.status })
    }

    return NextResponse.json({ signature: data.data?.signature || data.signature })
  } catch (err: any) {
    console.error('Sign route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
