import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

const client = new Anthropic()

interface ExtractRequest {
  pageContent: string
  pageUrl: string
  pageTitle: string
}

export async function POST(request: Request) {
  try {
    const { pageContent, pageUrl, pageTitle }: ExtractRequest = await request.json()

    if (!pageContent || !pageUrl) {
      return NextResponse.json(
        { error: 'Page content and URL are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Truncate content if too long (max ~50k chars for context)
    const truncatedContent = pageContent.slice(0, 50000)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Extract job posting information from the following webpage content. If this is not a job posting page, respond with {"isJobPage": false}.

If it IS a job posting, extract the following information and respond with a JSON object:

{
  "isJobPage": true,
  "title": "Job title",
  "companyName": "Company name",
  "description": "Full job description text",
  "requirements": "Job requirements/qualifications (if separate from description)",
  "responsibilities": "Job responsibilities (if separate from description)",
  "location": "Job location",
  "locationType": "REMOTE" | "ONSITE" | "HYBRID" | null,
  "salaryMin": number or null,
  "salaryMax": number or null,
  "salaryCurrency": "USD" | "EUR" | etc or null,
  "salaryPeriod": "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null,
  "employmentType": "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY" | null,
  "experienceLevel": "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE" | null
}

Page URL: ${pageUrl}
Page Title: ${pageTitle}

Page Content:
${truncatedContent}

Respond ONLY with the JSON object, no other text.`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    let extractedData
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse job data', isJobPage: false },
        { status: 200, headers: corsHeaders }
      )
    }

    if (!extractedData.isJobPage) {
      return NextResponse.json(
        { isJobPage: false, error: 'This does not appear to be a job posting page' },
        { status: 200, headers: corsHeaders }
      )
    }

    // Determine source site from URL
    let sourceSite = 'other'
    const url = new URL(pageUrl)
    if (url.hostname.includes('linkedin')) sourceSite = 'linkedin'
    else if (url.hostname.includes('indeed')) sourceSite = 'indeed'
    else if (url.hostname.includes('glassdoor')) sourceSite = 'glassdoor'
    else if (url.hostname.includes('dice')) sourceSite = 'dice'
    else if (url.hostname.includes('ziprecruiter')) sourceSite = 'ziprecruiter'
    else if (url.hostname.includes('monster')) sourceSite = 'monster'
    else sourceSite = url.hostname.replace('www.', '').split('.')[0]

    return NextResponse.json({
      isJobPage: true,
      data: {
        title: extractedData.title,
        companyName: extractedData.companyName,
        description: extractedData.description || '',
        requirements: extractedData.requirements,
        responsibilities: extractedData.responsibilities,
        location: extractedData.location,
        locationType: extractedData.locationType,
        salaryMin: extractedData.salaryMin,
        salaryMax: extractedData.salaryMax,
        salaryCurrency: extractedData.salaryCurrency,
        salaryPeriod: extractedData.salaryPeriod,
        employmentType: extractedData.employmentType,
        experienceLevel: extractedData.experienceLevel,
        sourceUrl: pageUrl,
        sourceSite,
      },
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json(
      { error: 'Failed to extract job data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
