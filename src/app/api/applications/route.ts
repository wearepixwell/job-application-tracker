import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Failed to get applications:', error)
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: { jobId },
    })

    if (existingApplication) {
      return NextResponse.json(existingApplication)
    }

    // Get profile
    let profile = await prisma.profile.findFirst()
    if (!profile) {
      profile = await prisma.profile.create({ data: {} })
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        profileId: profile.id,
        stage: 'APPLIED',
        appliedDate: new Date(),
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error('Failed to create application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
