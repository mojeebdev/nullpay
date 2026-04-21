import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import canonicalize from 'canonicalize'

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

    const url        = `https://api.privy.io/v1/wallets/${walletId}/rpc`
    const requestBody = {
      method: 'secp256k1_sign',
      params: { hash },
    }

    // P-256 authorization signature
    const expiry = (Date.now() + 60000).toString() // 1 min from now

    const payload = canonicalize({
      version: 1,
      method: 'POST',
      url,
      body: requestBody,
      headers: { 'privy-app-id': appId },
    })!

    const privateKeyAsString = authKey.replace('wallet-auth:', '')
    const privateKeyAsPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyAsString}\n-----END PRIVATE KEY-----`
    const privateKey = crypto.createPrivateKey({ key: privateKeyAsPem, format: 'pem' })

    const signatureBuffer = crypto.sign('sha256', Buffer.from(payload), privateKey)
    const signature = signatureBuffer.toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
        'privy-authorization-signature': signature,
        'privy-request-expiry': expiry,
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
