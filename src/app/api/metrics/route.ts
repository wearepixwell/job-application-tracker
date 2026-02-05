import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getDateRange(period: string): Date {
  const now = new Date()

  switch (period) {
    case 'today':
      // Start of today
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':
      // 7 days ago
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return weekAgo
    case 'month':
    default:
      // 30 days ago
      const monthAgo = new Date(now)
      monthAgo.setDate(monthAgo.getDate() - 30)
      return monthAgo
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const startDate = getDateRange(period)

    const [
      totalJobs,
      appliedJobs,
      interviewJobs,
      offerJobs,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          stage: 'APPLIED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          stage: 'INTERVIEW',
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          stage: 'OFFER',
          createdAt: { gte: startDate }
        }
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: { gte: startDate }
        },
        include: { company: true },
      }),
    ])

    const avgMatchScore = await prisma.job.aggregate({
      _avg: { matchScore: true },
      where: {
        matchScore: { not: null },
        createdAt: { gte: startDate }
      },
    })

    return NextResponse.json({
      totalJobs,
      appliedJobs,
      interviewJobs,
      offerJobs,
      avgMatchScore: avgMatchScore._avg.matchScore || 0,
      recentJobs,
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
