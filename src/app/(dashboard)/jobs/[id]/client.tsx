'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  Copy,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  location: string | null
  locationType: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  employmentType: string
  experienceLevel: string | null
  sourceUrl: string
  sourceSite: string
  matchScore: number | null
  extractedSkills: any
  missingSkills: any
  matchingSkills: any
  coverLetterBullets: any
  scannedAt: string | Date
  company: {
    id: string
    name: string
    logoUrl: string | null
    website: string | null
    industry: string | null
    size: string | null
  }
  application: {
    id: string
    stage: string
  } | null
}

interface CoverLetterBullet {
  text: string
  relevance: number
  targetRequirement: string
}

interface JobDetailsClientProps {
  job: Job
  hasResume: boolean
}

export function JobDetailsClient({ job, hasResume }: JobDetailsClientProps) {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [currentJob, setCurrentJob] = useState(job)

  const handleAnalyze = async () => {
    if (!hasResume) {
      toast.error('Please upload your resume first in the Profile section')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/analyze`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentJob(data)
        toast.success('Analysis complete!')
      } else {
        toast.error('Analysis failed. Please try again.')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentJob({ ...currentJob, application: data })
        toast.success('Job added to your applications!')
        router.refresh()
      } else {
        toast.error('Failed to add application')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setApplying(false)
    }
  }

  const copyBullet = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatSalary = () => {
    if (!currentJob.salaryMin && !currentJob.salaryMax) return null
    const currency = currentJob.salaryCurrency || 'USD'
    const period = currentJob.salaryPeriod?.toLowerCase() || 'yearly'

    if (currentJob.salaryMin && currentJob.salaryMax) {
      return `$${currentJob.salaryMin.toLocaleString()} - $${currentJob.salaryMax.toLocaleString()} ${currency}/${period}`
    }
    if (currentJob.salaryMin) {
      return `From $${currentJob.salaryMin.toLocaleString()} ${currency}/${period}`
    }
    return `Up to $${currentJob.salaryMax?.toLocaleString()} ${currency}/${period}`
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {currentJob.company.logoUrl ? (
              <img
                src={currentJob.company.logoUrl}
                alt={currentJob.company.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currentJob.title}</h1>
            <p className="text-lg text-muted-foreground">{currentJob.company.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {currentJob.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentJob.location}
                </Badge>
              )}
              <Badge variant="secondary">{currentJob.locationType}</Badge>
              <Badge variant="secondary">{currentJob.employmentType.replace('_', ' ')}</Badge>
              {currentJob.experienceLevel && (
                <Badge variant="secondary">{currentJob.experienceLevel}</Badge>
              )}
              <Badge variant="outline">{currentJob.sourceSite}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={currentJob.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Original
            </a>
          </Button>
          {currentJob.application ? (
            <Button variant="secondary" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Applied
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={applying}>
              {applying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Applied
            </Button>
          )}
        </div>
      </div>

      {/* Salary */}
      {formatSalary() && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-lg font-semibold">{formatSalary()}</span>
          </CardContent>
        </Card>
      )}

      {/* Match Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Resume Match Analysis
              </CardTitle>
              <CardDescription>
                How well your resume matches this job
              </CardDescription>
            </div>
            {!currentJob.matchScore && (
              <Button onClick={handleAnalyze} disabled={analyzing || !hasResume}>
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Match
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasResume ? (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Upload your resume in the{' '}
                <Link href="/profile" className="text-primary hover:underline">
                  Profile section
                </Link>{' '}
                to see match analysis.
              </p>
            </div>
          ) : currentJob.matchScore !== null ? (
            <div className="space-y-6">
              {/* Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-2xl font-bold">
                    {Math.round(currentJob.matchScore)}%
                  </span>
                </div>
                <Progress value={currentJob.matchScore} className="h-3" />
              </div>

              <Separator />

              {/* Skills */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(currentJob.matchingSkills as string[] || []).length > 0 ? (
                      (currentJob.matchingSkills as string[]).map((skill, i) => (
                        <Badge key={i} variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching skills found</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Skills to Develop
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(currentJob.missingSkills as string[] || []).length > 0 ? (
                      (currentJob.missingSkills as string[]).map((skill, i) => (
                        <Badge key={i} variant="outline" className="border-orange-500/50 text-orange-700">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">All skills covered!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Click &quot;Analyze Match&quot; to see how your resume matches this job.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter Bullets */}
      {currentJob.coverLetterBullets && (currentJob.coverLetterBullets as CoverLetterBullet[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Suggested Cover Letter Bullets
            </CardTitle>
            <CardDescription>
              Tailored bullet points based on your experience and this job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(currentJob.coverLetterBullets as CoverLetterBullet[]).map((bullet, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="flex-1">
                    <p className="text-sm">{bullet.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Addresses: {bullet.targetRequirement}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyBullet(bullet.text)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Details */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Description */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{currentJob.description}</p>
            </div>

            {currentJob.requirements && (
              <>
                <Separator className="my-6" />
                <h4 className="font-semibold mb-3">Requirements</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {currentJob.requirements}
                </p>
              </>
            )}

            {currentJob.responsibilities && (
              <>
                <Separator className="my-6" />
                <h4 className="font-semibold mb-3">Responsibilities</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {currentJob.responsibilities}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{currentJob.company.name}</p>
            </div>

            {currentJob.company.industry && (
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{currentJob.company.industry}</p>
              </div>
            )}

            {currentJob.company.size && (
              <div>
                <p className="text-sm text-muted-foreground">Company Size</p>
                <p className="font-medium">{currentJob.company.size}</p>
              </div>
            )}

            {currentJob.company.website && (
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={currentJob.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Visit Website
                </a>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Scanned</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(currentJob.scannedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
