import { useEffect, useState } from 'react'
import { api } from '../../lib/axios'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Course {
  id: string
  title: string
  description: string
  _count: {
    modules: number
  }
}

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

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

  async function handleDeleteCourse(id: string) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return

    try {
      await api.delete(`/courses/${id}`)
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      alert('Erro ao excluir curso')
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
        <Link
          to="/admin/courses/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" /> Novo Curso
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map(course => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      <BookOpen size={20} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{course.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course._count.modules}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/admin/courses/${course.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Edit size={18} className="inline" />
                  </Link>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} className="inline" />
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                  Nenhum curso cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
