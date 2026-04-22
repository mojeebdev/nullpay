import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const appId = process.env.PRIVY_APP_ID
    const appSecret = process.env.PRIVY_APP_SECRET

    if (!appId || !appSecret) {
      console.error('Missing PRIVY_APP_ID or PRIVY_APP_SECRET')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const authHeader = 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const payload = JSON.stringify({
      wallets: [{ chain_type: 'ethereum', owner: { user_id: userId } }]
    })

  
    const result = await new Promise<{ status: number; data: any }>((resolve, reject) => {
      const options = {
        hostname: 'api.privy.io',
        path: `/v1/users/${userId}/wallets`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'privy-app-id': appId,
          'Content-Length': payload.length,
        },
      }

      const request = https.request(options, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            resolve({ status: res.statusCode || 200, data: parsed })
          } catch {
            resolve({ status: res.statusCode || 200, data: { raw: data } })
          }
        })
      })

      request.on('error', (err) => {
        console.error('HTTPS request error:', err)
        reject(err)
      })

      request.write(payload)
      request.end()
    })

    
    if (result.status >= 400) {
      console.error('Privy API error:', result.status, result.data)
      return NextResponse.json(
        { error: result.data?.message || 'Failed to create wallet' },
        { status: result.status }
      )
    }

    console.log('✅ Wallet created successfully for user:', userId)
    return NextResponse.json({ success: true, data: result.data })

  } catch (err: any) {
    console.error('Wallet creation error:', err.message)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}