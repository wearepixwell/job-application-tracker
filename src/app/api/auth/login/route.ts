import { NextResponse } from 'next/server'
import { verifyPasscode, createSession, setSessionCookie } from '@/lib/auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json()

    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const isValid = await verifyPasscode(passcode)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = await createSession()
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      token, // Also return token for extension to use
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
