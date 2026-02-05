import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeJobMatch, generateCoverLetterBullets } from '@/lib/anthropic'

interface JobScanData {
  title: string
  companyName: string
  companyLogoUrl?: string
  companyWebsite?: string
  description: string
  requirements?: string
  responsibilities?: string
  location?: string
  locationType?: 'REMOTE' | 'ONSITE' | 'HYBRID'
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  salaryPeriod?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY'
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  sourceUrl: string
  sourceSite: string
}

export async function POST(request: Request) {
  try {
    const data: JobScanData = await request.json()

    // Validate required fields
    if (!data.title || !data.companyName || !data.description || !data.sourceUrl || !data.sourceSite) {
      return NextResponse.json(
        { error: 'Missing required fields: title, companyName, description, sourceUrl, sourceSite' },
        { status: 400 }
      )
    }

    // Get or create profile
    let profile = await prisma.profile.findFirst()
    if (!profile) {
      profile = await prisma.profile.create({ data: {} })
    }

    // Get or create company
    let company = await prisma.company.findUnique({
      where: { name: data.companyName },
    })

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: data.companyName,
          logoUrl: data.companyLogoUrl,
          website: data.companyWebsite,
        },
      })
    } else if (data.companyLogoUrl && !company.logoUrl) {
      // Update logo if we have one and company doesn't
      company = await prisma.company.update({
        where: { id: company.id },
        data: { logoUrl: data.companyLogoUrl },
      })
    }

    // Check if job already exists
    const existingJob = await prisma.job.findUnique({
      where: { sourceUrl: data.sourceUrl },
      include: { company: true, application: true },
    })

    if (existingJob) {
      return NextResponse.json({
        job: existingJob,
        isNew: false,
        message: 'Job already scanned',
      })
    }

    // Create new job
    const job = await prisma.job.create({
      data: {
        title: data.title,
        companyId: company.id,
        profileId: profile.id,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        location: data.location,
        locationType: data.locationType || 'ONSITE',
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        salaryPeriod: data.salaryPeriod,
        employmentType: data.employmentType || 'FULL_TIME',
        experienceLevel: data.experienceLevel,
        sourceUrl: data.sourceUrl,
        sourceSite: data.sourceSite,
      },
      include: { company: true },
    })

    // Run analysis if resume exists
    if (profile.resumeText) {
      try {
        const analysis = await analyzeJobMatch(
          profile.resumeText,
          job.title,
          job.description,
          job.requirements || undefined
        )

        const bullets = await generateCoverLetterBullets(
          profile.resumeText,
          job.title,
          job.description,
          company.name
        )

        // Update job with analysis
        const updatedJob = await prisma.job.update({
          where: { id: job.id },
          data: {
            matchScore: analysis.overallScore,
            matchingSkills: analysis.matchingSkills as unknown as undefined,
            missingSkills: analysis.missingSkills as unknown as undefined,
            extractedSkills: [...analysis.matchingSkills, ...analysis.missingSkills] as unknown as undefined,
            coverLetterBullets: bullets as unknown as undefined,
          },
          include: { company: true, application: true },
        })

        return NextResponse.json({
          job: updatedJob,
          isNew: true,
          analyzed: true,
        })
      } catch (analysisError) {
        console.error('Analysis error:', analysisError)
        // Return job without analysis
      }
    }

    return NextResponse.json({
      job,
      isNew: true,
      analyzed: false,
    })
  } catch (error) {
    console.error('Job scan error:', error)
    return NextResponse.json(
      { error: 'Failed to process job' },
      { status: 500 }
    )
  }
}
