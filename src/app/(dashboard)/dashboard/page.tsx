'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Briefcase,
  Send,
  Calendar,
  Trophy,
  TrendingUp,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

type TimePeriod = 'today' | 'week' | 'month'

interface Job {
  id: string
  title: string
  matchScore: number | null
  sourceSite: string
  company: {
    name: string
    logoUrl: string | null
  }
}

interface Metrics {
  totalJobs: number
  appliedJobs: number
  interviewJobs: number
  offerJobs: number
  avgMatchScore: number
  recentJobs: Job[]
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics(period)
  }, [period])

  const fetchMetrics = async (timePeriod: TimePeriod) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/metrics?period=${timePeriod}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = metrics
    ? [
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
    : []

  return (
    <div className="space-y-8">
      {/* Header with Time Period Tabs */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your job application progress
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
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
                  <div className="text-4xl font-bold">{stat.value}</div>
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
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : !metrics || metrics.recentJobs.length === 0 ? (
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
