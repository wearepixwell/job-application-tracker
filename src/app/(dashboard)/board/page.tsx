'use client'

import { useState, useEffect } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Building2, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  stage: string
  appliedDate: string | null
  job: {
    id: string
    title: string
    location: string | null
    matchScore: number | null
    sourceUrl: string
    company: {
      name: string
      logoUrl: string | null
    }
  }
}

const STAGES = [
  { id: 'SAVED', title: 'Saved', color: 'bg-slate-500' },
  { id: 'APPLIED', title: 'Applied', color: 'bg-blue-500' },
  { id: 'SCREENING', title: 'Screening', color: 'bg-purple-500' },
  { id: 'INTERVIEW', title: 'Interview', color: 'bg-yellow-500' },
  { id: 'OFFER', title: 'Offer', color: 'bg-green-500' },
  { id: 'REJECTED', title: 'Rejected', color: 'bg-red-500' },
]

export default function BoardPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Optimistically update UI
    const newStage = destination.droppableId
    const updatedApplications = applications.map((app) =>
      app.id === draggableId ? { ...app, stage: newStage } : app
    )
    setApplications(updatedApplications)

    // Update in database
    try {
      const response = await fetch(`/api/applications/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      toast.success(`Moved to ${STAGES.find((s) => s.id === newStage)?.title}`)
    } catch {
      // Revert on error
      setApplications(applications)
      toast.error('Failed to update application status')
    }
  }

  const getApplicationsByStage = (stageId: string) => {
    return applications.filter((app) => app.stage === stageId)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Job Tracker</h1>
          <p className="text-muted-foreground">Track your application progress</p>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.id} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Job Tracker</h1>
        <p className="text-muted-foreground">
          Drag and drop to update application status
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4 min-h-[calc(100vh-200px)]">
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {getApplicationsByStage(stage.id).length}
                </Badge>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-accent'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="space-y-2">
                      {getApplicationsByStage(stage.id).map((app, index) => (
                        <Draggable
                          key={app.id}
                          draggableId={app.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card
                                className={`cursor-grab active:cursor-grabbing ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <CardHeader className="p-3 pb-2">
                                  <div className="flex items-start gap-2">
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                      {app.job.company.logoUrl ? (
                                        <img
                                          src={app.job.company.logoUrl}
                                          alt={app.job.company.name}
                                          className="h-8 w-8 rounded object-cover"
                                        />
                                      ) : (
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <CardTitle className="text-sm font-medium truncate">
                                        {app.job.title}
                                      </CardTitle>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {app.job.company.name}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  <div className="flex items-center justify-between text-xs">
                                    {app.job.location && (
                                      <span className="flex items-center gap-1 text-muted-foreground truncate">
                                        <MapPin className="h-3 w-3" />
                                        {app.job.location}
                                      </span>
                                    )}
                                    {app.job.matchScore && (
                                      <Badge
                                        variant={
                                          app.job.matchScore >= 70
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {Math.round(app.job.matchScore)}%
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Link
                                      href={`/jobs/${app.job.id}`}
                                      className="text-xs text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View Details
                                    </Link>
                                    <a
                                      href={app.job.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-muted-foreground hover:text-foreground"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {getApplicationsByStage(stage.id).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Drop jobs here
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
