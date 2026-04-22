import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined

    try {
      const body = await req.json()
      userId = body?.userId
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKeyId = process.env.PRIVY_AUTHORIZATION_KEY_ID!

    console.log('Creating wallet for userId:', userId)

    const res = await fetch(`https://api.privy.io/v1/users/${userId}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
        'origin': 'https://nullpay.blindspotlab.xyz',
      },
      body: JSON.stringify({
        wallets: [{ 
          chain_type: 'ethereum',
          owner_id: authKeyId,
        }],
      }),
    })

    const data = await res.json()
    console.log('Wallet create response:', data)

    if (!res.ok) {
      console.error('Wallet create error:', data)
      return NextResponse.json({ error: data.error || 'Failed to create wallet' }, { status: res.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}





