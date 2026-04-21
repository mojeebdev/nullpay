import { NextRequest, NextResponse } from 'next/server'
import canonicalize from 'canonicalize'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { walletId, hash } = body

    if (!walletId || !hash) {
      return NextResponse.json({ error: 'Missing walletId or hash' }, { status: 400 })
    }

    const appId     = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKey   = process.env.PRIVY_AUTHORIZATION_KEY!

    const url         = `https://api.privy.io/v1/wallets/${walletId}/rpc`
    const requestBody = {
      method: 'secp256k1_sign',
      params: { hash },
    }

    // ✅ Exact payload structure per Privy docs
    const signaturePayload = {
      version: 1,
      method: 'POST',
      url: url,                          // no trailing slash
      body: requestBody,                 // JSON object, not string
      headers: {
        'privy-app-id': appId,           // ONLY privy- headers here
      },
    }

    // ✅ Canonicalize per RFC 8785
    const serialized = canonicalize(signaturePayload)!

    // ✅ Sign with ECDSA P-256, base64 output
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
    console.log('Privy response:', data)

    if (!res.ok) {
      console.error('Privy sign error:', data)
      return NextResponse.json(
        { error: data.message || data.error || 'Signing failed' },
        { status: res.status }
      )
    }

    return NextResponse.json({
      signature: data.data?.signature || data.signature,
    })
  } catch (err: any) {
    console.error('Sign route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
