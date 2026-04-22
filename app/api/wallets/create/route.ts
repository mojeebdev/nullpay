import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    // 1. Validation
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const appId = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!

    
    const payload = {
      wallets: [{ 
        chain_type: 'ethereum',
        owner: {
          user_id: userId 
        }
      }],
    }

    console.log('Final Bounty Payload:', JSON.stringify(payload))

    // 3. The Fetch Call
    const res = await fetch(`https://privy.io{userId}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    // 4. Handle Response
    if (!res.ok) {
      console.error('Privy API Error:', data)
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error('Final Route Crash:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
