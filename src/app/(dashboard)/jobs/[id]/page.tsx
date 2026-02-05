export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { JobDetailsClient } from './client'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getJob(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      application: true,
    },
  })
  return job
}

async function getProfile() {
  return prisma.profile.findFirst()
}

export default async function JobDetailsPage({ params }: PageProps) {
  const { id } = await params
  const [job, profile] = await Promise.all([getJob(id), getProfile()])

  if (!job) {
    notFound()
  }

  return <JobDetailsClient job={job} hasResume={!!profile?.resumeText} />
}
