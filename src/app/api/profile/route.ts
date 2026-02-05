import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Get or create profile (single user system)
async function getOrCreateProfile() {
  let profile = await prisma.profile.findFirst()
  if (!profile) {
    profile = await prisma.profile.create({
      data: {},
    })
  }
  return profile
}

export async function GET() {
  try {
    const profile = await getOrCreateProfile()
    return NextResponse.json(profile, { headers: corsHeaders })
  } catch (error) {
    console.error('Failed to get profile:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const profile = await getOrCreateProfile()

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        resumeText: data.resumeText,
        coverLetterTemplate: data.coverLetterTemplate,
      },
    })

    return NextResponse.json(updated, { headers: corsHeaders })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500, headers: corsHeaders }
    )
  }
}
