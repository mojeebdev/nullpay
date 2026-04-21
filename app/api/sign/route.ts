import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { walletId, hash } = await req.json()
    if (!walletId || !hash) {
      return NextResponse.json({ error: 'Missing walletId or hash' }, { status: 400 })
    }

    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!

    const res = await fetch(`https://auth.privy.io/api/v1/wallets/${walletId}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
      },
      body: JSON.stringify({
        method: 'secp256k1_sign',
        params: { hash },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Privy sign error:', data)
      return NextResponse.json({ error: data.message || 'Signing failed' }, { status: res.status })
    }

    return NextResponse.json({ signature: data.data?.signature || data.signature })
  } catch (err: any) {
    console.error('Sign route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}