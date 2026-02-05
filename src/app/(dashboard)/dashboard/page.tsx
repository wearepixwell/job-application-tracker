export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  Send,
  Calendar,
  Trophy,
  TrendingUp,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

async function getMetrics() {
  const [
    totalJobs,
    appliedJobs,
    interviewJobs,
    offerJobs,
    recentJobs,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.application.count({ where: { stage: 'APPLIED' } }),
    prisma.application.count({ where: { stage: 'INTERVIEW' } }),
    prisma.application.count({ where: { stage: 'OFFER' } }),
    prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    }),
  ])

  const avgMatchScore = await prisma.job.aggregate({
    _avg: { matchScore: true },
    where: { matchScore: { not: null } },
  })

  return {
    totalJobs,
    appliedJobs,
    interviewJobs,
    offerJobs,
    avgMatchScore: avgMatchScore._avg.matchScore || 0,
    recentJobs,
  }
}

export default async function DashboardPage() {
  const metrics = await getMetrics()

  const statCards = [
    {
      title: 'Jobs Scanned',
      value: metrics.totalJobs,
      icon: Briefcase,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Applied',
      value: metrics.appliedJobs,
      icon: Send,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Interviews',
      value: metrics.interviewJobs,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Offers',
      value: metrics.offerJobs,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Avg Match',
      value: `${Math.round(metrics.avgMatchScore)}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your job application progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Scanned Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No jobs scanned yet.</p>
              <p className="text-sm">Use the browser extension to scan job postings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {job.company.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {job.matchScore && (
                      <Badge
                        variant={
                          job.matchScore >= 70
                            ? 'default'
                            : job.matchScore >= 50
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {Math.round(job.matchScore)}% match
                      </Badge>
                    )}
                    <Badge variant="outline">{job.sourceSite}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
