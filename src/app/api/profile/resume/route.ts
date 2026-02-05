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

// Get or create profile
async function getOrCreateProfile() {
  let profile = await prisma.profile.findFirst()
  if (!profile) {
    profile = await prisma.profile.create({ data: {} })
  }
  return profile
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      )
    }

    let text = ''
    const fileName = file.name

    if (file.type === 'application/pdf') {
      // Parse PDF using dynamic require
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Use require for CommonJS module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      text = pdfData.text
    } else if (file.type === 'text/plain') {
      // Parse plain text
      text = await file.text()
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or TXT.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Clean up the text
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()

    // Update profile with resume text
    const profile = await getOrCreateProfile()
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        resumeText: text,
        resumeFileName: fileName,
      },
    })

    return NextResponse.json({
      success: true,
      text,
      fileName,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Failed to parse resume:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume' },
      { status: 500, headers: corsHeaders }
    )
  }
}
