import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// Disable worker for serverless environment
GlobalWorkerOptions.workerSrc = ''

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

// Extract text from PDF using pdfjs-dist
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocument({ data: buffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: unknown) => (item as { str: string }).str)
      .join(' ')
    fullText += pageText + '\n'
  }

  return fullText
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
      // Parse PDF using pdfjs-dist
      const arrayBuffer = await file.arrayBuffer()
      text = await extractTextFromPDF(arrayBuffer)
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
