import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface MatchAnalysis {
  overallScore: number
  matchingSkills: string[]
  missingSkills: string[]
  experienceGap: string
  recommendations: string[]
}

export interface CoverLetterBullet {
  text: string
  relevance: number
  targetRequirement: string
}

export async function analyzeJobMatch(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  jobRequirements?: string
): Promise<MatchAnalysis> {
  const prompt = `You are a professional job matching analyst. Analyze how well the candidate's resume matches the job posting.

RESUME:
${resumeText}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

${jobRequirements ? `JOB REQUIREMENTS:\n${jobRequirements}` : ''}

Analyze the match and return a JSON object with these fields:
- overallScore: number from 0-100 representing match percentage
- matchingSkills: array of skills that appear in both resume and job
- missingSkills: array of required skills not found in resume
- experienceGap: brief description of experience gaps
- recommendations: array of 2-3 suggestions to improve the match

Return ONLY valid JSON, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    // Strip markdown code block formatting if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    const result = JSON.parse(jsonText) as MatchAnalysis
    console.log('Match analysis result:', JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    // If JSON parsing fails, return default values
    console.error('Failed to parse match analysis JSON:', error)
    console.error('Raw response:', content.text)
    return {
      overallScore: 50,
      matchingSkills: [],
      missingSkills: [],
      experienceGap: 'Unable to analyze',
      recommendations: ['Please ensure your resume is complete'],
    }
  }
}

export async function generateCoverLetterBullets(
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  companyName: string
): Promise<CoverLetterBullet[]> {
  const prompt = `You are an expert cover letter writer. Generate 5 powerful bullet points for a cover letter based on the resume and job posting.

CANDIDATE'S RESUME:
${resumeText}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

Generate exactly 5 bullet points using this format:
- Start with a strong action verb (gerund form: -ing)
- Focus on a specific skill or activity relevant to the job
- Include context or purpose

Example format:
- "Translating complex financial data and regulations into simple, accessible user experiences."
- "Designing secure payment flows that balance fraud prevention with user convenience."
- "Building scalable design systems that maintain consistency across mobile, web, and physical touchpoints."

Match each bullet to a specific job requirement. Return ONLY a JSON array with objects containing:
- text: the bullet point text
- relevance: number 0-100 indicating how relevant it is to the job
- targetRequirement: the job requirement this bullet addresses

Return ONLY valid JSON array, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    // Strip markdown code block formatting if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    return JSON.parse(jsonText) as CoverLetterBullet[]
  } catch (error) {
    // If JSON parsing fails, return empty array
    console.error('Failed to parse cover letter bullets JSON:', error)
    console.error('Raw response:', content.text)
    return []
  }
}

export { anthropic }
