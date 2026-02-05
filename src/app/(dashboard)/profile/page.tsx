'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  FileText,
  Upload,
  Save,
  Loader2,
} from 'lucide-react'

interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  resumeText: string | null
  resumeFileName: string | null
  coverLetterTemplate: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (response.ok) {
        toast.success('Profile saved successfully')
      } else {
        toast.error('Failed to save profile')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/profile/resume', {
        method: 'POST',
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        setProfile((prev) =>
          prev ? { ...prev, resumeText: data.text, resumeFileName: data.fileName } : prev
        )
        toast.success('Resume uploaded and parsed successfully')
      } else {
        toast.error('Failed to upload resume')
      }
    } catch {
      toast.error('An error occurred while uploading')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your information and resume
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your contact details and online presence
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="John Doe"
                className="pl-10"
                value={profile?.name || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="pl-10"
                value={profile?.email || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                className="pl-10"
                value={profile?.phone || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, phone: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/username"
                className="pl-10"
                value={profile?.linkedinUrl || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, linkedinUrl: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub URL</Label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="github"
                placeholder="https://github.com/username"
                className="pl-10"
                value={profile?.githubUrl || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, githubUrl: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="portfolio"
                placeholder="https://yourportfolio.com"
                className="pl-10"
                value={profile?.portfolioUrl || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, portfolioUrl: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
          <CardDescription>
            Upload your resume for job matching analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                <p>Uploading and parsing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="font-medium">
                  {isDragActive
                    ? 'Drop your resume here'
                    : 'Drag & drop your resume here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PDF or TXT)
                </p>
              </div>
            )}
          </div>

          {profile?.resumeFileName && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.resumeFileName}</span>
            </div>
          )}

          {profile?.resumeText && (
            <div className="space-y-2">
              <Label>Parsed Resume Content</Label>
              <Textarea
                value={profile.resumeText}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, resumeText: e.target.value } : prev
                  )
                }
                className="min-h-[200px] font-mono text-sm"
                placeholder="Your parsed resume text will appear here..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter Template */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Letter Template</CardTitle>
          <CardDescription>
            Default template used for generating cover letter suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile?.coverLetterTemplate || ''}
            onChange={(e) =>
              setProfile((prev) =>
                prev ? { ...prev, coverLetterTemplate: e.target.value } : prev
              )
            }
            className="min-h-[300px]"
            placeholder="Enter your cover letter template here. Use placeholders like [Company Name], [Position Title], etc."
          />
        </CardContent>
      </Card>
    </div>
  )
}
