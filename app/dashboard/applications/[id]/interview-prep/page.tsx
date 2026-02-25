// app/dashboard/applications/[id]/interview-prep/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Brain, Lightbulb,
  FileText, Clock, AlertTriangle, Award, TrendingUp, RotateCcw,
  Send, StopCircle, PenLine, ListChecks, Play,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/database.types'

type Application = Database['public']['Tables']['applications']['Row']
type SessionMode = 'written' | 'mcq'

type MCQOption = { id: string; text: string }
type WrittenQuestion = { id: string; category: string; question: string; tips: string[]; sample_answer?: string }
type MCQQuestion = { id: string; category: string; question: string; tips: string[]; mcq_options: MCQOption[]; correct_option_id: string; explanation: string }

type InterviewPrep = {
  written_questions?: WrittenQuestion[]
  mcq_questions?: MCQQuestion[]
  questions?: WrittenQuestion[]  // legacy flat array
  key_topics: string[]
  preparation_tips: string[]
  company_insights: string[]
  generated_at: string
}

type WrittenAnswer = { questionId: string; answer: string; timeSpent: number }
type MCQAnswer = { questionId: string; selectedOptionId: string; isCorrect: boolean; timeSpent: number }
type QuestionFeedback = { question_id: string; question: string; user_answer: string; strengths: string[]; improvements: string[]; ideal_approach: string; score: number }
type AIFeedback = { overall_score: number; question_feedback: QuestionFeedback[]; general_advice: string[]; encouragement: string }
type CompletedSessions = {
  written?: { answers: WrittenAnswer[]; feedback: AIFeedback | null }
  mcq?: { answers: MCQAnswer[]; score: number; correct: number; total: number }
}

export default function InterviewPrepPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [application, setApplication] = useState<Application | null>(null)
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null)

  // ── START SCREEN ──────────────────────────────────────────────────────
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState<SessionMode>('written')

  // Active tab — always visible once quiz started, user can switch freely
  const [activeTab, setActiveTab] = useState<SessionMode>('written')

  // Per-question expanded state (one per tab, independent)
  const [writtenExpandedId, setWrittenExpandedId] = useState<string | null>(null)
  const [mcqExpandedId, setMCQExpandedId] = useState<string | null>(null)

  // Written answers
  const [writtenAnswers, setWrittenAnswers] = useState<WrittenAnswer[]>([])
  const [currentAnswerText, setCurrentAnswerText] = useState('')

  // MCQ answers
  const [mcqAnswers, setMCQAnswers] = useState<MCQAnswer[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [revealedAnswer, setRevealedAnswer] = useState(false)

  // Timers — shared, track overall session time
  const [sessionStarted, setSessionStarted] = useState(false)
  const [generalTime, setGeneralTime] = useState(0)
  const [questionTime, setQuestionTime] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const generalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Results
  const [completedSessions, setCompletedSessions] = useState<CompletedSessions>({})
  const [analyzing, setAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const applicationId = typeof params.id === 'string' ? params.id : undefined

  // Safe accessors
  const writtenQuestions: WrittenQuestion[] = interviewPrep?.written_questions ?? interviewPrep?.questions ?? []
  const mcqQuestions: MCQQuestion[] = (interviewPrep?.mcq_questions as MCQQuestion[]) ?? []

  const activeQuestions = activeTab === 'written'
    ? writtenQuestions as (WrittenQuestion | MCQQuestion)[]
    : mcqQuestions as (WrittenQuestion | MCQQuestion)[]

  const activeExpandedId = activeTab === 'written' ? writtenExpandedId : mcqExpandedId
  const setActiveExpandedId = activeTab === 'written' ? setWrittenExpandedId : setMCQExpandedId

  const writtenAllAnswered = writtenQuestions.length > 0 && writtenAnswers.length >= writtenQuestions.length
  const mcqAllAnswered = mcqQuestions.length > 0 && mcqAnswers.length >= mcqQuestions.length

  const currentTabAllAnswered = activeTab === 'written' ? writtenAllAnswered : mcqAllAnswered
  const bothStarted = writtenAnswers.length > 0 && mcqAnswers.length > 0
  const bothAllAnswered = writtenAllAnswered && mcqAllAnswered

  const writtenDone = !!completedSessions.written
  const mcqDone = !!completedSessions.mcq

  const questionTimeLimit = 150
  const totalTimeLimit = (writtenQuestions.length + mcqQuestions.length) * questionTimeLimit

  useEffect(() => { if (applicationId) loadApplication() }, [applicationId])
  useEffect(() => () => { stopTimers() }, [])

  // Auto-advance on question timeout
  useEffect(() => {
    if (!sessionStarted || !activeExpandedId) return
    if (questionTime >= questionTimeLimit) handleAutoAdvance()
    else if (questionTimeLimit - questionTime === 10) toast.warning('10 seconds left!', { duration: 3000 })
  }, [questionTime, sessionStarted, activeExpandedId])

  // Overall time warning
  useEffect(() => {
    if (!sessionStarted) return
    if (totalTimeLimit - generalTime <= 60 && !showTimeWarning) {
      setShowTimeWarning(true)
      toast.warning('Less than 1 minute remaining overall!', { duration: 5000 })
    }
  }, [generalTime, sessionStarted, showTimeWarning])

  const stopTimers = () => {
    if (generalTimerRef.current) clearInterval(generalTimerRef.current)
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)
  }

  const startQuestionTimer = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    setQuestionTime(0)
    questionTimerRef.current = setInterval(() => setQuestionTime(p => p + 1), 1000)
  }

  const ensureSessionStarted = () => {
    if (!sessionStarted) {
      setSessionStarted(true)
      generalTimerRef.current = setInterval(() => setGeneralTime(p => p + 1), 1000)
    }
  }

  // ── START QUIZ ────────────────────────────────────────────────────────
  const startQuiz = () => {
    const questions = selectedMode === 'written' ? writtenQuestions : mcqQuestions
    if (!questions.length) return
    setActiveTab(selectedMode)
    setQuizStarted(true)
    // Auto-expand first question and begin timers
    setWrittenExpandedId(null)
    setMCQExpandedId(null)
    setWrittenAnswers([])
    setMCQAnswers([])
    setCurrentAnswerText('')
    setSelectedOptionId(null)
    setRevealedAnswer(false)
    setGeneralTime(0)
    setQuestionTime(0)
    setSessionStarted(false)
    setShowTimeWarning(false)
    // Expand and start on the first question of the selected mode
    const firstId = questions[0].id
    if (selectedMode === 'written') setWrittenExpandedId(firstId)
    else setMCQExpandedId(firstId)
    // Start timers immediately
    setSessionStarted(true)
    generalTimerRef.current = setInterval(() => setGeneralTime(p => p + 1), 1000)
    startQuestionTimer()
  }

  const handleStopQuiz = () => {
    stopTimers()
    setQuizStarted(false)
    setSessionStarted(false)
    setWrittenExpandedId(null)
    setMCQExpandedId(null)
    setCurrentAnswerText('')
    setSelectedOptionId(null)
    setRevealedAnswer(false)
    setQuestionTime(0)
    setGeneralTime(0)
    setWrittenAnswers([])
    setMCQAnswers([])
    setShowTimeWarning(false)
    toast.info('Session stopped.')
  }

  // When user expands a question — start session timer if not started, reset question timer
  const handleExpandQuestion = (questionId: string) => {
    ensureSessionStarted()
    setActiveExpandedId(questionId)
    if (activeTab === 'written') setCurrentAnswerText('')
    else { setSelectedOptionId(null); setRevealedAnswer(false) }
    startQuestionTimer()
  }

  // Switch tab — preserve state, reset question-level state for new tab
  const handleSwitchTab = (tab: SessionMode) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    if (tab === 'written') {
      setCurrentAnswerText('')
    } else {
      setSelectedOptionId(null)
      setRevealedAnswer(false)
    }
    const newExpanded = tab === 'written' ? writtenExpandedId : mcqExpandedId
    if (newExpanded) startQuestionTimer()
    else { if (questionTimerRef.current) clearInterval(questionTimerRef.current); setQuestionTime(0) }
  }

  const advanceToNext = (answeredWritten: WrittenAnswer[], answeredMCQ: MCQAnswer[]) => {
    const questions = activeTab === 'written'
      ? writtenQuestions as (WrittenQuestion | MCQQuestion)[]
      : mcqQuestions as (WrittenQuestion | MCQQuestion)[]
    const currentIdx = questions.findIndex(q => q.id === activeExpandedId)
    const next = questions[currentIdx + 1]
    if (next) {
      setActiveExpandedId(next.id)
      if (activeTab === 'written') setCurrentAnswerText('')
      else { setSelectedOptionId(null); setRevealedAnswer(false) }
      startQuestionTimer()
    } else {
      setActiveExpandedId(null)
      if (questionTimerRef.current) clearInterval(questionTimerRef.current)
      setQuestionTime(0)
    }
  }

  const handleAutoAdvance = () => {
    if (!activeExpandedId) return
    if (activeTab === 'written') {
      const updated = [...writtenAnswers, { questionId: activeExpandedId, answer: currentAnswerText.trim() || '(No answer provided)', timeSpent: questionTime }]
      setWrittenAnswers(updated)
      toast.info("Time's up! Moving to next question...")
      advanceToNext(updated, mcqAnswers)
    } else {
      const q = mcqQuestions.find(q => q.id === activeExpandedId)
      const updated = [...mcqAnswers, { questionId: activeExpandedId, selectedOptionId: selectedOptionId || '', isCorrect: selectedOptionId === q?.correct_option_id, timeSpent: questionTime }]
      setMCQAnswers(updated)
      toast.info("Time's up! Moving to next question...")
      advanceToNext(writtenAnswers, updated)
    }
  }

  const handleSubmitWritten = () => {
    if (!activeExpandedId || !currentAnswerText.trim()) { toast.error('Please provide an answer'); return }
    ensureSessionStarted()
    const updated = [...writtenAnswers, { questionId: activeExpandedId, answer: currentAnswerText.trim(), timeSpent: questionTime }]
    setWrittenAnswers(updated)
    advanceToNext(updated, mcqAnswers)
  }

  const handleMCQSelect = (optionId: string) => { if (!revealedAnswer) { ensureSessionStarted(); setSelectedOptionId(optionId) } }
  const handleMCQConfirm = () => { if (selectedOptionId) setRevealedAnswer(true) }
  const handleMCQNext = () => {
    if (!activeExpandedId || !selectedOptionId) return
    const q = mcqQuestions.find(q => q.id === activeExpandedId)!
    const updated = [...mcqAnswers, { questionId: activeExpandedId, selectedOptionId, isCorrect: selectedOptionId === q.correct_option_id, timeSpent: questionTime }]
    setMCQAnswers(updated)
    advanceToNext(writtenAnswers, updated)
  }

  const handleFinish = async () => {
    stopTimers()
    const updated: CompletedSessions = { ...completedSessions }

    if (mcqAllAnswered && !completedSessions.mcq) {
      const correct = mcqAnswers.filter(a => a.isCorrect).length
      updated.mcq = { answers: mcqAnswers, score: Math.round((correct / mcqAnswers.length) * 100), correct, total: mcqAnswers.length }
    }

    if (writtenAllAnswered && !completedSessions.written) {
      updated.written = { answers: writtenAnswers, feedback: null }
      setCompletedSessions({ ...updated })
      setAnalyzing(true)
      try {
        const res = await fetch('/api/analyze-interview-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, questions: writtenQuestions, answers: writtenAnswers, totalTime: generalTime }),
        })
        if (!res.ok) throw new Error()
        const { feedback } = await res.json()
        updated.written = { answers: writtenAnswers, feedback }
        setCompletedSessions({ ...updated })
        toast.success('Analysis complete!')
      } catch { toast.error('Failed to analyze written answers.') }
      finally { setAnalyzing(false) }
    } else {
      setCompletedSessions({ ...updated })
    }

    if (mcqAllAnswered && updated.mcq) toast.success('MCQ scored!')
    setShowResults(true)
    setQuizStarted(false)
  }

  const resetAll = () => {
    stopTimers()
    setQuizStarted(false)
    setSessionStarted(false)
    setWrittenAnswers([])
    setMCQAnswers([])
    setCurrentAnswerText('')
    setSelectedOptionId(null)
    setRevealedAnswer(false)
    setWrittenExpandedId(null)
    setMCQExpandedId(null)
    setGeneralTime(0)
    setQuestionTime(0)
    setCompletedSessions({})
    setShowResults(false)
    setShowTimeWarning(false)
  }

  const loadApplication = async () => {
    if (!applicationId) return
    try {
      const { data, error } = await supabase.from('applications').select('*').eq('id', applicationId).single()
      if (error) throw error
      setApplication(data)
      if (data.interview_questions) setInterviewPrep(data.interview_questions as InterviewPrep)
    } catch { toast.error('Failed to load application') }
    finally { setLoading(false) }
  }

  const handleGeneratePrep = async () => {
    if (!applicationId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-interview-prep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const { interviewPrep: newPrep } = await res.json()
      setInterviewPrep(newPrep)
      toast.success('Interview questions generated!')
    } catch (e: any) { toast.error(e.message) }
    finally { setGenerating(false) }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const getScoreColor = (s: number) => s >= 85 ? 'text-foreground' : s >= 55 ? 'text-muted-foreground' : 'text-destructive'
  const getScoreBg = (s: number) => s >= 85 ? 'bg-accent/30 border border-accent' : s >= 55 ? 'bg-muted border border-border' : 'bg-destructive/10 border border-destructive/30'

  const overallScore = (() => {
    const scores: number[] = []
    if (completedSessions.written?.feedback) scores.push(completedSessions.written.feedback.overall_score)
    if (completedSessions.mcq) scores.push(completedSessions.mcq.score)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null
  })()

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!application) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Application not found</p></div>

  // ── RESULTS PAGE ──────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <Button variant="ghost" onClick={() => setShowResults(false)} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Prep
          </Button>
          <div className="bg-card rounded-3xl shadow-sm p-6 sm:p-8 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {writtenAllAnswered && mcqAllAnswered ? 'Both Sessions Complete!' : 'Session Complete!'}
            </h2>
            {overallScore !== null && (
              <div className={`inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full my-4 sm:my-6 ${getScoreBg(overallScore)}`}>
                <span className={`text-4xl sm:text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {completedSessions.written?.feedback && <span>Written: {completedSessions.written.feedback.overall_score}/100</span>}
              {completedSessions.mcq && <span>MCQ: {completedSessions.mcq.correct}/{completedSessions.mcq.total} correct ({completedSessions.mcq.score}%)</span>}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />Total time: {formatTime(generalTime)}
            </div>
          </div>

          {completedSessions.mcq && (
            <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <ListChecks className="w-5 h-5 text-foreground" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">MCQ Results</h2>
                <span className="ml-auto text-sm text-muted-foreground">{completedSessions.mcq.correct}/{completedSessions.mcq.total} correct</span>
              </div>
              <div className="space-y-4">
                {completedSessions.mcq.answers.map((answer, idx) => {
                  const question = mcqQuestions.find(q => q.id === answer.questionId)
                  if (!question) return null
                  const selectedOpt = question.mcq_options.find(o => o.id === answer.selectedOptionId)
                  const correctOpt = question.mcq_options.find(o => o.id === question.correct_option_id)
                  return (
                    <div key={idx} className={`border rounded-xl p-4 ${answer.isCorrect ? 'border-accent bg-accent/10' : 'border-destructive/30 bg-destructive/5'}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {answer.isCorrect ? <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
                        <p className="font-medium text-foreground text-sm">{question.question}</p>
                      </div>
                      <div className="ml-8 space-y-1">
                        <p className="text-sm text-muted-foreground">Your answer: <span className={`font-medium ${answer.isCorrect ? 'text-foreground' : 'text-destructive'}`}>{selectedOpt?.text || 'No answer'}</span></p>
                        {!answer.isCorrect && <p className="text-sm text-muted-foreground">Correct: <span className="font-medium text-foreground">{correctOpt?.text}</span></p>}
                        {question.explanation && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{question.explanation}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {analyzing && (
            <div className="bg-card rounded-3xl shadow-sm p-8 border border-border text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-foreground" />
              <h2 className="text-xl font-bold text-foreground mb-2">Analyzing Written Answers...</h2>
              <p className="text-sm text-muted-foreground">Our AI is reviewing your responses</p>
            </div>
          )}

          {completedSessions.written?.feedback && (
            <>
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
                <div className="flex items-center gap-2 mb-6"><PenLine className="w-5 h-5 text-foreground" /><h2 className="text-lg sm:text-xl font-bold text-foreground">Written Feedback</h2></div>
                <div className="space-y-4 sm:space-y-6">
                  {completedSessions.written.feedback.question_feedback.map((qf, idx) => (
                    <div key={idx} className="border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="font-semibold text-foreground flex-1 text-sm sm:text-base">Q{idx + 1}: {qf.question}</h3>
                        <span className={`font-bold text-lg flex-shrink-0 ${getScoreColor(qf.score)}`}>{qf.score}</span>
                      </div>
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs font-medium text-foreground mb-1">Your Answer:</p>
                        <p className="text-sm text-muted-foreground">{qf.user_answer}</p>
                      </div>
                      {qf.strengths?.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-foreground flex-shrink-0" /><h4 className="font-semibold text-foreground text-sm">What You Got Right</h4></div>
                          <ul className="space-y-1 ml-6">{qf.strengths.map((s, i) => <li key={i} className="text-sm text-foreground">• {s}</li>)}</ul>
                        </div>
                      )}
                      {qf.improvements?.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /><h4 className="font-semibold text-foreground text-sm">Areas to Improve</h4></div>
                          <ul className="space-y-1 ml-6">{qf.improvements.map((s, i) => <li key={i} className="text-sm text-foreground">• {s}</li>)}</ul>
                        </div>
                      )}
                      {qf.ideal_approach && (
                        <div className="p-3 bg-muted/50 border border-border rounded-lg">
                          <h4 className="font-semibold text-foreground mb-1 text-sm">Ideal Approach</h4>
                          <p className="text-sm text-muted-foreground">{qf.ideal_approach}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {completedSessions.written.feedback.general_advice?.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4"><Lightbulb className="w-5 h-5 text-foreground" /><h2 className="text-lg font-bold text-foreground">General Improvement Advice</h2></div>
                  <ul className="space-y-3">{completedSessions.written.feedback.general_advice.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-foreground"><span className="text-muted-foreground mt-1">•</span><span>{a}</span></li>)}</ul>
                </div>
              )}
              {completedSessions.written.feedback.encouragement && (
                <div className="bg-muted/50 rounded-2xl p-4 sm:p-6 border border-border">
                  <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 flex-shrink-0 text-foreground" />
                    <div><h3 className="font-semibold text-foreground mb-2">Keep Going!</h3><p className="text-sm text-muted-foreground">{completedSessions.written.feedback.encouragement}</p></div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={resetAll} className="flex-1 font-semibold rounded-xl py-6"><RotateCcw className="w-5 h-5 mr-2" />Practice Again</Button>
            <Button onClick={() => router.push(`/dashboard/applications/${applicationId}`)} variant="outline" className="flex-1 rounded-xl py-6"><ArrowLeft className="w-5 h-5 mr-2" />Back to Application</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN PAGE ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/dashboard/applications/${applicationId}`}>
            <Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" />Back to Application</Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Interview Preparation</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{application.job_title} at {application.company_name}</p>
            </div>
            {!interviewPrep && (
              <Button onClick={handleGeneratePrep} disabled={generating} className="font-semibold rounded-xl w-full sm:w-auto">
                {generating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...</> : <><Brain className="w-5 h-5 mr-2" />Generate Interview Prep</>}
              </Button>
            )}
          </div>
        </div>

        {!interviewPrep ? (
          /* ── EMPTY STATE ── */
          <div className="bg-card rounded-3xl shadow-sm p-8 sm:p-12 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">No Interview Prep Yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">Generate AI-powered interview questions tailored to this role and company.</p>
            <Button onClick={handleGeneratePrep} disabled={generating} className="font-semibold rounded-xl px-8 w-full sm:w-auto">
              {generating ? 'Generating...' : 'Generate Interview Prep'}
            </Button>
          </div>

        ) : !quizStarted ? (
          /* ── START SCREEN ── */
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl shadow-sm p-6 sm:p-8 border border-border">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                  {writtenDone || mcqDone ? 'Continue Practicing?' : 'Ready to Practice?'}
                </h2>

                {/* Mode selector */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-3">Select session type:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => !writtenDone && setSelectedMode('written')}
                      disabled={writtenDone}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        writtenDone
                          ? 'border-accent bg-accent/10 opacity-60 cursor-not-allowed'
                          : selectedMode === 'written'
                          ? 'border-foreground bg-muted'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <PenLine className="w-5 h-5 text-foreground flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-foreground">Written {writtenDone && '✓'}</p>
                        <p className="text-xs text-muted-foreground">
                          {writtenDone ? 'Completed' : `${writtenQuestions.length} essay questions`}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => !mcqDone && setSelectedMode('mcq')}
                      disabled={mcqDone || !mcqQuestions.length}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        mcqDone
                          ? 'border-accent bg-accent/10 opacity-60 cursor-not-allowed'
                          : !mcqQuestions.length
                          ? 'border-border opacity-40 cursor-not-allowed'
                          : selectedMode === 'mcq'
                          ? 'border-foreground bg-muted'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <ListChecks className="w-5 h-5 text-foreground flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-foreground">MCQ {mcqDone && '✓'}</p>
                        <p className="text-xs text-muted-foreground">
                          {mcqDone ? 'Completed' : mcqQuestions.length ? `${mcqQuestions.length} multiple choice` : 'Not available'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Session info */}
                <div className="space-y-4 mb-6 sm:mb-8">
                  {[
                    {
                      icon: <FileText className="w-6 h-6 text-foreground" />,
                      title: selectedMode === 'written'
                        ? `${writtenQuestions.length} Questions`
                        : `${mcqQuestions.length} Questions`,
                      desc: selectedMode === 'written'
                        ? 'Behavioral, technical, and role-specific topics'
                        : 'Multiple choice, instantly scored',
                    },
                    {
                      icon: <Clock className="w-6 h-6 text-foreground" />,
                      title: `${formatTime((selectedMode === 'written' ? writtenQuestions.length : mcqQuestions.length) * 150)} Total Time`,
                      desc: '2.5 minutes per question',
                    },
                    {
                      icon: <Brain className="w-6 h-6 text-foreground" />,
                      title: selectedMode === 'written' ? 'AI Feedback' : 'Instant Scoring',
                      desc: selectedMode === 'written'
                        ? 'Get detailed analysis and improvement suggestions'
                        : 'See correct answers and explanations immediately',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={startQuiz}
                  disabled={
                    (selectedMode === 'written' && (writtenDone || !writtenQuestions.length)) ||
                    (selectedMode === 'mcq' && (mcqDone || !mcqQuestions.length))
                  }
                  className="w-full font-semibold rounded-xl py-6 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start {selectedMode === 'written' ? 'Written' : 'MCQ'} Session
                </Button>

                {(writtenDone || mcqDone) && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => setShowResults(true)} variant="outline" className="flex-1 rounded-xl">
                      View Results
                    </Button>
                  </div>
                )}

                {(writtenDone || mcqDone) && !(writtenDone && mcqDone) && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Complete the other session for a combined score.
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {interviewPrep.key_topics?.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">Key Topics</h3></div>
                  <ul className="space-y-2">
                    {interviewPrep.key_topics.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground" /><span>{t}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {interviewPrep.preparation_tips?.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4"><Lightbulb className="w-5 h-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">Preparation Tips</h3></div>
                  <ul className="space-y-3">
                    {interviewPrep.preparation_tips.map((t, i) => (
                      <li key={i} className="text-sm text-foreground"><span className="font-medium">{i + 1}.</span> {t}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={handleGeneratePrep} disabled={generating} variant="outline" className="w-full rounded-xl">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Regenerating...</> : <><RotateCcw className="w-4 h-4 mr-2" />Get New Questions</>}
              </Button>
            </div>
          </div>

        ) : (
          /* ── ACTIVE QUIZ — Doc 1's tab-based UI, fully intact ── */
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">

              {/* Session timer */}
              {sessionStarted && (
                <div className="bg-card rounded-2xl shadow-sm p-4 border border-border">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-lg font-bold text-foreground">{formatTime(generalTime)}</span>
                      <span className="text-xs text-muted-foreground">elapsed</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {writtenQuestions.length > 0 && (
                        <span className={writtenAllAnswered ? 'text-foreground font-medium' : ''}>
                          Written {writtenAnswers.length}/{writtenQuestions.length}
                          {writtenAllAnswered && ' ✓'}
                        </span>
                      )}
                      {mcqQuestions.length > 0 && (
                        <span className={mcqAllAnswered ? 'text-foreground font-medium' : ''}>
                          MCQ {mcqAnswers.length}/{mcqQuestions.length}
                          {mcqAllAnswered && ' ✓'}
                        </span>
                      )}
                      <Button onClick={handleStopQuiz} variant="destructive" size="sm" className="rounded-lg">
                        <StopCircle className="w-4 h-4 mr-1" />Stop
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab toggle — ALWAYS VISIBLE during quiz */}
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="flex">
                  <button
                    onClick={() => handleSwitchTab('written')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                      activeTab === 'written'
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <PenLine className="w-4 h-4" />
                    Written
                    {writtenAllAnswered && <CheckCircle className="w-3.5 h-3.5" />}
                    {!writtenAllAnswered && writtenAnswers.length > 0 && (
                      <span className="text-xs opacity-70">{writtenAnswers.length}/{writtenQuestions.length}</span>
                    )}
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => handleSwitchTab('mcq')}
                    disabled={!mcqQuestions.length}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                      activeTab === 'mcq'
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <ListChecks className="w-4 h-4" />
                    MCQ
                    {mcqAllAnswered && <CheckCircle className="w-3.5 h-3.5" />}
                    {!mcqAllAnswered && mcqAnswers.length > 0 && (
                      <span className="text-xs opacity-70">{mcqAnswers.length}/{mcqQuestions.length}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Questions for active tab */}
              <div className="space-y-3">
                {activeQuestions.map((question, idx) => {
                  const isAnswered = activeTab === 'written'
                    ? writtenAnswers.some(a => a.questionId === question.id)
                    : mcqAnswers.some(a => a.questionId === question.id)
                  const isExpanded = activeExpandedId === question.id
                  const isLastQuestion = idx === activeQuestions.length - 1
                  const q = question as MCQQuestion

                  return (
                    <div
                      key={question.id}
                      className={`bg-card rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
                        isExpanded ? 'border-foreground shadow-md' : isAnswered ? 'border-accent' : 'border-border'
                      }`}
                    >
                      {/* Collapsed header */}
                      {!isExpanded && (
                        <button
                          className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                          onClick={() => !isAnswered && handleExpandQuestion(question.id)}
                          disabled={isAnswered}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                                  {question.category.replace(/-/g, ' ')}
                                </span>
                                <span className="text-xs text-muted-foreground">Question {idx + 1}</span>
                              </div>
                              <p className="text-foreground font-medium text-sm sm:text-base">{question.question}</p>
                            </div>
                            <div className="flex-shrink-0 mt-1">
                              {isAnswered
                                ? <CheckCircle className="w-5 h-5 text-foreground" />
                                : <div className="w-5 h-5 rounded-full border-2 border-border" />
                              }
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Expanded answer area */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                Question {idx + 1} of {activeQuestions.length}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                                {question.category.replace(/-/g, ' ')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-mono text-base sm:text-lg font-bold text-foreground">{formatTime(questionTime)}</span>
                                <span className="text-xs text-muted-foreground">/ {formatTime(questionTimeLimit)}</span>
                              </div>
                              {activeTab === 'written' && (
                                <Button onClick={handleSubmitWritten} disabled={!currentAnswerText.trim()} size="sm" className="font-semibold rounded-lg">
                                  <Send className="w-4 h-4 sm:mr-2" />
                                  <span className="hidden sm:inline">{isLastQuestion ? 'Done' : 'Continue'}</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Question progress bar */}
                          <div className="mb-4 sm:mb-6 w-full bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all duration-300 bg-foreground" style={{ width: `${Math.min((questionTime / questionTimeLimit) * 100, 100)}%` }} />
                          </div>

                          <div className="mb-4 sm:mb-6 p-4 bg-muted/50 rounded-xl border border-border">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">{question.question}</h3>
                          </div>

                          {/* Written input */}
                          {activeTab === 'written' && (
                            <>
                              <Textarea
                                value={currentAnswerText}
                                onChange={e => setCurrentAnswerText(e.target.value)}
                                placeholder="Type your answer here... Use the STAR method (Situation, Task, Action, Result)"
                                rows={8}
                                className="border-border focus:border-foreground focus:ring-1 focus:ring-foreground rounded-xl resize-none mb-4 text-sm sm:text-base"
                              />
                              {question.tips?.length > 0 && (
                                <div className="p-4 bg-muted/50 border border-border rounded-xl mb-4">
                                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm">
                                    <Lightbulb className="w-4 h-4" />Tips
                                  </h4>
                                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                                    {question.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}

                          {/* MCQ options */}
                          {activeTab === 'mcq' && (
                            <div className="space-y-3 mb-4">
                              {q.mcq_options.map(option => {
                                const isSelected = selectedOptionId === option.id
                                const isCorrect = option.id === q.correct_option_id
                                let cls = 'border-border hover:border-muted-foreground hover:bg-muted/50'
                                if (revealedAnswer) {
                                  if (isCorrect) cls = 'border-foreground bg-accent/20'
                                  else if (isSelected && !isCorrect) cls = 'border-destructive bg-destructive/10'
                                  else cls = 'border-border opacity-40'
                                } else if (isSelected) cls = 'border-foreground bg-muted'
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => handleMCQSelect(option.id)}
                                    disabled={revealedAnswer}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${cls}`}
                                  >
                                    <span className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0 font-semibold text-sm text-foreground">
                                      {option.id.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-foreground flex-1">{option.text}</span>
                                    {revealedAnswer && isCorrect && <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0" />}
                                    {revealedAnswer && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                                  </button>
                                )
                              })}
                              {revealedAnswer && q.explanation && (
                                <div className="p-3 bg-muted/50 border border-border rounded-lg">
                                  <p className="text-xs font-medium text-foreground mb-1">Explanation</p>
                                  <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                </div>
                              )}
                              <div className="flex justify-end mt-2">
                                {!revealedAnswer
                                  ? <Button onClick={handleMCQConfirm} disabled={!selectedOptionId} className="font-semibold rounded-lg">Confirm Answer</Button>
                                  : <Button onClick={handleMCQNext} className="font-semibold rounded-lg">{isLastQuestion ? 'Done' : 'Next Question'}</Button>
                                }
                              </div>
                            </div>
                          )}

                          {questionTimeLimit - questionTime <= 30 && (
                            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-destructive">
                                {questionTimeLimit - questionTime <= 10 ? 'Less than 10 seconds remaining!' : '30 seconds remaining for this question'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Finish button — only shows when all questions on current tab answered */}
              {currentTabAllAnswered && (
                <div className="bg-card rounded-2xl shadow-sm p-4 border border-border">
                  {bothStarted && !bothAllAnswered ? (
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      Switch to the other tab to complete all questions for a combined score.
                    </p>
                  ) : null}
                  <Button
                    onClick={handleFinish}
                    disabled={analyzing}
                    className="w-full font-semibold rounded-xl py-5"
                  >
                    {analyzing
                      ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Analyzing...</>
                      : bothAllAnswered
                      ? 'Finish & Get Combined Results'
                      : `Finish ${activeTab === 'written' ? 'Written' : 'MCQ'} Session`
                    }
                  </Button>
                </div>
              )}

              <Button onClick={handleGeneratePrep} disabled={generating} variant="outline" className="w-full rounded-xl">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Regenerating...</> : <><RotateCcw className="w-4 h-4 mr-2" />Get New Questions</>}
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {interviewPrep.key_topics?.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border sticky top-4">
                  <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">Key Topics</h3></div>
                  <ul className="space-y-2">
                    {interviewPrep.key_topics.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground" /><span>{t}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {interviewPrep.preparation_tips?.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-2 mb-4"><Lightbulb className="w-5 h-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">Preparation Tips</h3></div>
                  <ul className="space-y-3">
                    {interviewPrep.preparation_tips.map((t, i) => (
                      <li key={i} className="text-sm text-foreground"><span className="font-medium">{i + 1}.</span> {t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}