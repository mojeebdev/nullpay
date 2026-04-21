import { NextRequest, NextResponse } from 'next/server'
import canonicalize from 'canonicalize'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKey   = process.env.PRIVY_AUTHORIZATION_KEY!
    const authKeyId = process.env.PRIVY_AUTHORIZATION_KEY_ID!

    const url         = 'https://api.privy.io/v1/wallets'
    const requestBody = {
      chain_type: 'ethereum',
      owner_id: authKeyId,
    }

    const signaturePayload = {
      version: 1,
      method: 'POST',
      url,
      body: requestBody,
      headers: { 'privy-app-id': appId },
    }

    const serialized    = canonicalize(signaturePayload)!
    const privateKeyStr = authKey.replace('wallet-auth:', '')
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyStr}\n-----END PRIVATE KEY-----`
    const privateKey    = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' })
    const sigBuffer     = crypto.sign('sha256', Buffer.from(serialized), privateKey)
    const signature     = sigBuffer.toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
        'privy-authorization-signature': signature,
        'origin': 'https://nullpay.blindspotlab.xyz',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Wallet create error:', data)
      return NextResponse.json({ error: data.error || 'Failed to create wallet' }, { status: res.status })
    }

    return NextResponse.json({ walletId: data.id, address: data.address })
  } catch (err: any) {
    console.error('Wallet create route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}