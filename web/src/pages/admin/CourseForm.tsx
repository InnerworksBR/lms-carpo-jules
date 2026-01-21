import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/axios'
import { Save, Plus, Trash2, Video } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  content_text: string | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export function CourseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      loadCourse()
    }
  }, [id])

  async function loadCourse() {
    setLoading(true)
    try {
      const response = await api.get(`/courses/${id}`)
      const course = response.data
      setTitle(course.title)
      setDescription(course.description)
      setCoverUrl(course.cover_url || '')
      setModules(course.modules || [])
    } catch (error) {
      console.error('Error loading course:', error)
      alert('Erro ao carregar curso')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const data = { title, description, cover_url: coverUrl }
      if (isNew) {
        const response = await api.post('/courses', data)
        navigate(`/admin/courses/${response.data.id}`)
      } else {
        await api.put(`/courses/${id}`, data)
        alert('Curso atualizado com sucesso!')
      }
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Erro ao salvar curso')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddModule() {
    const title = prompt('Título do Módulo:')
    if (!title) return

    try {
      const response = await api.post('/modules', { title, course_id: id })
      setModules([...modules, { ...response.data, lessons: [] }])
    } catch (error) {
      alert('Erro ao adicionar módulo')
    }
  }

  async function handleAddLesson(moduleId: string) {
    const title = prompt('Título da Aula:')
    if (!title) return

    try {
      const response = await api.post('/lessons', { title, module_id: moduleId })
      setModules(modules.map(m =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, response.data] } : m
      ))
    } catch (error) {
      alert('Erro ao adicionar aula')
    }
  }

  async function handleDeleteLesson(lessonId: string, moduleId: string) {
    if (!confirm('Excluir aula?')) return

    try {
      await api.delete(`/lessons/${lessonId}`)
      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      ))
    } catch (error) {
      alert('Erro ao excluir aula')
    }
  }

  async function handleUploadVideo(lessonId: string, moduleId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const video_url = uploadRes.data.fileUrl
      await api.put(`/lessons/${lessonId}`, { video_url })

      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, video_url } : l) }
          : m
      ))

      alert('Vídeo enviado com sucesso!')
    } catch (error) {
      console.error(error)
      alert('Erro no upload')
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'Criar Novo Curso' : 'Editar Curso'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700">URL da Capa (Opcional)</label>
            <input
              id="coverUrl"
              type="text"
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save size={20} className="mr-2" /> {saving ? 'Salvando...' : 'Salvar Curso'}
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Módulos e Aulas</h2>
            <button
              onClick={handleAddModule}
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Plus size={16} className="mr-1" /> Adicionar Módulo
            </button>
          </div>

          <div className="space-y-4">
            {modules.map(module => (
              <div key={module.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{module.title}</h3>
                  <button
                    onClick={() => handleAddLesson(module.id)}
                    className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    + Aula
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {module.lessons.map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Video size={18} className="text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{lesson.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {lesson.video_url ? (
                          <span className="text-xs text-green-600 font-medium">Vídeo OK</span>
                        ) : (
                          <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                            Upload Vídeo
                            <input
                              type="file"
                              className="hidden"
                              accept="video/*"
                              onChange={e => e.target.files?.[0] && handleUploadVideo(lesson.id, module.id, e.target.files[0])}
                            />
                          </label>
                        )}
                        <button
                          onClick={() => handleDeleteLesson(lesson.id, module.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {module.lessons.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">Nenhuma aula neste módulo.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
