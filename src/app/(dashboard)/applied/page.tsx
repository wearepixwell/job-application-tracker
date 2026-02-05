'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Briefcase,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  stage: string
  appliedDate: string | null
  job: {
    id: string
    title: string
    location: string | null
    locationType: string
    salaryMin: number | null
    salaryMax: number | null
    salaryCurrency: string | null
    matchScore: number | null
    sourceUrl: string
    sourceSite: string
    employmentType: string
    company: {
      name: string
      logoUrl: string | null
    }
  }
}

const STAGE_COLORS: Record<string, string> = {
  SAVED: 'bg-slate-500',
  APPLIED: 'bg-blue-500',
  SCREENING: 'bg-purple-500',
  INTERVIEW: 'bg-yellow-500',
  OFFER: 'bg-green-500',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-gray-500',
  ACCEPTED: 'bg-emerald-500',
}

const STAGE_LABELS: Record<string, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  ACCEPTED: 'Accepted',
}

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = filter
    ? applications.filter((app) => app.stage === filter)
    : applications

  const formatSalary = (app: Application) => {
    const { salaryMin, salaryMax, salaryCurrency } = app.job
    if (!salaryMin && !salaryMax) return null

    const currency = salaryCurrency || 'USD'
    if (salaryMin && salaryMax) {
      return `$${(salaryMin / 1000).toFixed(0)}k - $${(salaryMax / 1000).toFixed(0)}k ${currency}`
    }
    if (salaryMin) return `From $${(salaryMin / 1000).toFixed(0)}k ${currency}`
    return `Up to $${((salaryMax || 0) / 1000).toFixed(0)}k ${currency}`
  }

  const stageCounts = applications.reduce((acc, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Applied Jobs</h1>
          <p className="text-muted-foreground">All your job applications</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applied Jobs</h1>
        <p className="text-muted-foreground">
          {applications.length} total application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(null)}
        >
          All ({applications.length})
        </Button>
        {Object.entries(STAGE_LABELS).map(([stage, label]) => {
          const count = stageCounts[stage] || 0
          if (count === 0) return null
          return (
            <Button
              key={stage}
              variant={filter === stage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(stage)}
              className="gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter ? 'No applications in this stage' : 'No applications yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              Scan jobs using the browser extension and click &quot;Applied&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Company Logo */}
                  <div className="w-24 bg-muted flex items-center justify-center border-r">
                    {app.job.company.logoUrl ? (
                      <img
                        src={app.job.company.logoUrl}
                        alt={app.job.company.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {app.job.title}
                        </Link>
                        <p className="text-muted-foreground">{app.job.company.name}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {app.job.location && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {app.job.location}
                            </span>
                          )}
                          {formatSalary(app) && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {formatSalary(app)}
                            </span>
                          )}
                          {app.appliedDate && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Applied {new Date(app.appliedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${STAGE_COLORS[app.stage]} text-white`}>
                          {STAGE_LABELS[app.stage]}
                        </Badge>
                        {app.job.matchScore && (
                          <Badge
                            variant={
                              app.job.matchScore >= 70
                                ? 'default'
                                : app.job.matchScore >= 50
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {Math.round(app.job.matchScore)}% match
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <Badge variant="outline">{app.job.locationType}</Badge>
                      <Badge variant="outline">
                        {app.job.employmentType.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{app.job.sourceSite}</Badge>

                      <div className="ml-auto flex items-center gap-2">
                        <Link href={`/jobs/${app.job.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <a
                          href={app.job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
