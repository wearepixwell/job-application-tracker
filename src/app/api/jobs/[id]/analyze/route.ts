import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeJobMatch, generateCoverLetterBullets } from '@/lib/anthropic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    // Get job
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get profile with resume
    const profile = await prisma.profile.findFirst()

    if (!profile?.resumeText) {
      return NextResponse.json(
        { error: 'No resume found. Please upload your resume first.' },
        { status: 400 }
      )
    }

    // Run analysis
    const analysis = await analyzeJobMatch(
      profile.resumeText,
      job.title,
      job.description,
      job.requirements || undefined
    )

    // Generate cover letter bullets
    const bullets = await generateCoverLetterBullets(
      profile.resumeText,
      job.title,
      job.description,
      job.company.name
    )

    // Update job with analysis results
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        matchScore: analysis.overallScore,
        matchingSkills: analysis.matchingSkills as unknown as undefined,
        missingSkills: analysis.missingSkills as unknown as undefined,
        extractedSkills: [...analysis.matchingSkills, ...analysis.missingSkills] as unknown as undefined,
        coverLetterBullets: bullets as unknown as undefined,
      },
      include: {
        company: true,
        application: true,
      },
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job' },
      { status: 500 }
    )
  }
}
