import { useEffect, useState } from 'react'
import { api } from '../lib/axios'
import { BookOpen, Clock, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Course {
  id: string
  title: string
  description: string
  cover_url: string | null
  is_enrolled: boolean
  progress_percentage?: number
  _count: {
    modules: number
  }
}

export function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await api.get('/courses')
        setCourses(response.data)
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const enrolledCourses = courses.filter(c => c.is_enrolled)
  const availableCourses = courses.filter(c => !c.is_enrolled)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Cursos em Andamento</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{enrolledCourses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Cursos Disponíveis</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{availableCourses.length}</p>
        </div>
      </div>

      {enrolledCourses.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PlayCircle className="mr-2 text-blue-600" /> Continuar Assistindo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enrolledCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <BookOpen className="mr-2 text-blue-600" /> Catálogo de Cursos
        </h2>
        {availableCourses.length === 0 && enrolledCourses.length === courses.length ? (
          <p className="text-gray-500">Você já está matriculado em todos os cursos disponíveis.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="h-40 bg-gray-200 relative">
        {course.cover_url ? (
          <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <BookOpen size={48} />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{course.description}</p>

        {course.is_enrolled && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="font-medium text-blue-600">{course.progress_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${course.progress_percentage || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-gray-500 flex items-center">
            <Clock size={14} className="mr-1" /> {course._count.modules} Módulos
          </span>

          <Link
            to={`/courses/${course.id}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              course.is_enrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {course.is_enrolled ? 'Continuar' : 'Ver Detalhes'}
          </Link>
        </div>
      </div>
    </div>
  )
}
