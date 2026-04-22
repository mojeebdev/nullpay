import { NextRequest, NextResponse } from 'next/server'
import canonicalize from 'canonicalize'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { walletId, hash } = await req.json()
    const appId = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKey = process.env.PRIVY_AUTHORIZATION_KEY! 

    const url = `https://privy.io{walletId}/rpc`
    const requestBody = { method: 'secp256k1_sign', params: { hash } }

    const serialized = canonicalize({
      version: 1,
      method: 'POST',
      url,
      body: requestBody,
      headers: { 'privy-app-id': appId },
    })!

    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${authKey.replace('wallet-auth:', '')}\n-----END PRIVATE KEY-----`
    const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' })
    const signature = crypto.sign('sha256', Buffer.from(serialized), privateKey).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64'),
        'privy-app-id': appId,
        'privy-authorization-signature': signature,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()
    return NextResponse.json({ signature: data.data?.signature || data.signature })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
