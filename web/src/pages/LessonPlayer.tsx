import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { ChevronLeft, PlayCircle, CheckCircle, Menu, X } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  content_text: string | null
  is_completed?: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  modules: Module[]
}

export function LessonPlayer() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    loadCourse()
  }, [courseId])

  useEffect(() => {
    if (course && lessonId) {
      const lesson = course.modules
        .flatMap(m => m.lessons)
        .find(l => l.id === lessonId)

      if (lesson) {
        setCurrentLesson(lesson)
      }
    } else if (course && !lessonId && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      // Auto-select first lesson if none specified
      const firstLesson = course.modules[0].lessons[0]
      navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, { replace: true })
    }
  }, [course, lessonId])

  async function loadCourse() {
    try {
      const response = await api.get(`/courses/${courseId}`)
      setCourse(response.data)

      // Also check if user is enrolled
      if (!response.data.is_enrolled) {
        // Automatically enroll for simplicity or redirect to detail page
        await api.post(`/courses/${courseId}/enroll`)
        // Reload to get enrollment status updated
        const updatedResponse = await api.get(`/courses/${courseId}`)
        setCourse(updatedResponse.data)
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar curso')
    } finally {
      setLoading(false)
    }
  }

  async function handleLessonEnd() {
    if (!currentLesson || currentLesson.is_completed) return

    try {
      await api.post(`/progress/lesson/${currentLesson.id}`)
      // Update local state
      setCourse(prev => {
        if (!prev) return null
        return {
          ...prev,
          modules: prev.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l =>
              l.id === currentLesson.id ? { ...l, is_completed: true } : l
            )
          }))
        }
      })
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>
  if (!course) return <div className="p-8">Curso não encontrado</div>

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Header for Player */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4 hover:text-gray-300">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="font-bold truncate max-w-md">{course.title} {currentLesson && `- ${currentLesson.title}`}</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Video) */}
        <div className="flex-1 overflow-y-auto bg-black flex flex-col">
          {currentLesson?.video_url ? (
            <div className="aspect-video w-full bg-black">
              <video
                key={currentLesson.video_url}
                src={currentLesson.video_url}
                controls
                className="w-full h-full"
                autoPlay
                onEnded={() => handleLessonEnd()}
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gray-800 flex items-center justify-center text-white flex-col p-4 text-center">
              <PlayCircle size={64} className="mb-4 text-gray-600" />
              <p className="text-xl font-medium">Nenhum vídeo disponível para esta aula.</p>
              {currentLesson?.content_text && (
                <p className="mt-4 text-gray-400 max-w-lg">{currentLesson.content_text}</p>
              )}
            </div>
          )}

          <div className="p-8 bg-white flex-1">
             <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentLesson?.title}</h2>
             <div className="prose max-w-none text-gray-700">
               {currentLesson?.content_text || 'Sem descrição adicional para esta aula.'}
             </div>
          </div>
        </div>

        {/* Lesson Sidebar */}
        <div className={`
          w-80 bg-white border-l border-gray-200 overflow-y-auto transition-all
          ${sidebarOpen ? 'block' : 'hidden'} lg:block
        `}>
          <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-700">
            Conteúdo do Curso
          </div>
          <div className="divide-y divide-gray-100">
            {course.modules.map(module => (
              <div key={module.id}>
                <div className="p-3 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {module.title}
                </div>
                <div className="py-1">
                  {module.lessons.map(lesson => (
                    <Link
                      key={lesson.id}
                      to={`/courses/${courseId}/lessons/${lesson.id}`}
                      className={`
                        flex items-center px-4 py-3 text-sm transition-colors
                        ${lesson.id === lessonId
                          ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'}
                      `}
                    >
                      <PlayCircle size={16} className="mr-3 flex-shrink-0" />
                      <span className="truncate">{lesson.title}</span>
                      {lesson.is_completed && <CheckCircle size={14} className="ml-auto text-green-500" />}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
