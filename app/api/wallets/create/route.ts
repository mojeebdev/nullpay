import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const appId = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    
    // Construct Auth header once
    const authHeader = 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64');

    const payload = {
      wallets: [{ 
        chain_type: 'ethereum',
        owner: { user_id: userId } 
      }],
    };

    // Use a try-catch specifically around the fetch to catch network errors
    const res = await fetch(`https://privy.io{userId}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'privy-app-id': appId,
      },
      body: JSON.stringify(payload),
      // Adding keepalive can sometimes help with 'fetch failed' in serverless
      keepalive: true, 
    }).catch(err => {
        throw new Error(`Network/Fetch Error: ${err.message}`);
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Privy Error Response:', data);
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('CRITICAL ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
