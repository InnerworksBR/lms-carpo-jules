import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/axios'
import { ChevronRight, PlayCircle, FileText, CheckCircle } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  content_text: string | null
  duration: number | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  modules: Module[]
}

interface Progress {
  completedLessonIds: string[]
  percentage: number
}

export function CourseDetails() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function handleLessonEnd() {
    if (!currentLesson) return

    try {
      await api.post(`/progress/lesson/${currentLesson.id}`)
      // Reload progress
      const progressRes = await api.get(`/progress/course/${id}`)
      setProgress(progressRes.data)
    } catch (error) {
      console.error('Erro ao marcar progresso:', error)
    }
  }

  useEffect(() => {
    async function loadCourse() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/progress/course/${id}`)
        ])

        setCourse(courseRes.data)
        setProgress(progressRes.data)

        // Auto-select first lesson if available
        if (courseRes.data.modules.length > 0 && courseRes.data.modules[0].lessons.length > 0) {
          setCurrentLesson(courseRes.data.modules[0].lessons[0])
        }
      } catch (error) {
        console.error('Erro ao carregar curso:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return <div>Curso não encontrado</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        {currentLesson ? (
          <div className="bg-black aspect-video rounded-lg overflow-hidden shadow-lg mb-6">
            {currentLesson.video_url ? (
              <video
                key={currentLesson.id}
                src={currentLesson.video_url}
                controls
                className="w-full h-full"
                onEnded={handleLessonEnd}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white flex-col">
                <PlayCircle size={64} className="mb-4 text-gray-600" />
                <p>Nenhum vídeo disponível para esta aula.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center mb-6">
            <p className="text-gray-500">Selecione uma aula para começar.</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentLesson?.title || course.title}
          </h1>
          <p className="text-gray-600 whitespace-pre-wrap">
            {currentLesson?.content_text || course.description}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-8">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">Conteúdo do Curso</h2>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[calc(100vh-200px)]">
            {course.modules.map((module) => (
              <div key={module.id} className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <ChevronRight size={16} className="mr-1" />
                  {module.title}
                </h3>

                <div className="space-y-2">
                  {module.lessons.map((lesson) => {
                    const isCompleted = progress?.completedLessonIds.includes(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`
                          w-full text-left p-3 rounded-md text-sm transition-colors flex items-center group
                          ${currentLesson?.id === lesson.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'hover:bg-gray-50 text-gray-600'}
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle size={16} className="mr-2 flex-shrink-0 text-green-500" />
                        ) : lesson.video_url ? (
                          <PlayCircle size={16} className={`mr-2 flex-shrink-0 ${currentLesson?.id === lesson.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                        ) : (
                          <FileText size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                        )}
                        <span className="flex-1 truncate">{lesson.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
