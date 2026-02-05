import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await request.json()

    const application = await prisma.application.update({
      where: { id },
      data: {
        stage: data.stage,
        notes: data.notes,
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
        offerDate: data.offerDate ? new Date(data.offerDate) : undefined,
        rejectedDate: data.rejectedDate ? new Date(data.rejectedDate) : undefined,
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
    console.error('Failed to update application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    await prisma.application.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
