import { NextRequest, NextResponse } from 'next/server'
import canonicalize from 'canonicalize'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { walletId, hash } = await req.json()

    if (!walletId) {
      return NextResponse.json(
        { error: 'walletId is required' },
        { status: 400 }
      )
    }

    if (!hash) {
      return NextResponse.json(
        { error: 'hash is required' },
        { status: 400 }
      )
    }

    const appId = process.env.PRIVY_APP_ID!
    const appSecret = process.env.PRIVY_APP_SECRET!
    const authKey = process.env.PRIVY_AUTHORIZATION_KEY!

    console.log('🔑 Key starts with wallet-auth:', authKey.startsWith('wallet-auth:'))
    console.log('🔑 Key length:', authKey.length)
    console.log('🔑 Raw key (first 40):', authKey.substring(0, 40))

    const url = `https://api.privy.io/v1/wallets/${walletId}/rpc`
    const requestBody = { method: 'secp256k1_sign', params: { hash } }

    const serialized = canonicalize({
      version: 1,
      method: 'POST',
      url,
      body: requestBody,
      headers: { 'privy-app-id': appId },
    })!

    if (!serialized) {
      throw new Error('Failed to canonicalize request')
    }

    console.log('📝 Signing request for wallet:', walletId)
    console.log('🔐 URL:', url)

    
    const rawKey = authKey.replace('wallet-auth:', '').replace(/\s+/g, '')
    const chunked = rawKey.match(/.{1,64}/g)!.join('\n')
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`

    const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' })
    const signature = crypto.sign('sha256', Buffer.from(serialized), privateKey).toString('base64')

    console.log('✅ Signature created, sending to Privy...')

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

    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await res.text()
      console.error('Non-JSON response from Privy:', res.status, text)
      return NextResponse.json(
        { error: `Privy API error: ${res.status}` },
        { status: res.status }
      )
    }

    if (!res.ok) {
      const errData = await res.json()
      console.error('Privy sign error:', res.status, errData)
      return NextResponse.json(
        { error: errData.message || 'Failed to sign with Privy' },
        { status: res.status }
      )
    }

    const data = await res.json()
    const signatureResult = data.data?.signature || data.signature

    if (!signatureResult) {
      throw new Error('No signature in response')
    }

    console.log('✅ Transaction signed successfully')
    return NextResponse.json({ signature: signatureResult })

  } catch (err: any) {
    console.error('Sign error:', err.message)
    return NextResponse.json(
      { error: err.message || 'Failed to sign transaction' },
      { status: 500 }
    )
  }
}
