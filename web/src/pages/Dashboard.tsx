import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { PlayCircle } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  cover_url: string | null
  _count: {
    modules: number
  }
  progress?: {
    percentage: number
  }
}

export function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await api.get('/courses')
        const coursesData = response.data

        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course: any) => {
            try {
              const progressRes = await api.get(`/progress/course/${course.id}`)
              return { ...course, progress: progressRes.data }
            } catch {
              return course
            }
          })
        )

        setCourses(coursesWithProgress)
      } catch (error) {
        console.error('Erro ao carregar cursos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourses()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Cursos</h1>

      {courses.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Nenhum curso disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="aspect-video bg-gray-200 relative">
                {course.cover_url ? (
                  <img
                    src={course.cover_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <PlayCircle size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {course.description}
                </p>

                {course.progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500 font-medium">Progresso</span>
                      <span className="text-blue-600 font-bold">{course.progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-gray-400">
                    {course._count.modules} módulos
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {course.progress && course.progress.percentage > 0 ? 'Continuar' : 'Acessar'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
