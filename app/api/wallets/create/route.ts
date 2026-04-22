import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKeyAddress = process.env.PRIVY_AUTHORIZATION_KEY_ID!

    // This is the object we are sending. 
    // Notice: NO 'owner_id' here. We use 'owner' with 'address'.
    const payload = {
      wallets: [{ 
        chain_type: 'ethereum',
        owner: {
          address: authKeyAddress 
        }
      }],
    }

    console.log('SENDING TO PRIVY:', JSON.stringify(payload, null, 2))

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
    console.log('PRIVY API RESPONSE:', data)

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('SERVER CRASH:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
