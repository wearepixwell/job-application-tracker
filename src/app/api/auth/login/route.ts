import { NextResponse } from 'next/server'
import { verifyPasscode, createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json()

    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      )
    }

    const isValid = await verifyPasscode(passcode)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      )
    }

    const token = await createSession()
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      token, // Also return token for extension to use
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
