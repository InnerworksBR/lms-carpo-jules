import { useState, useEffect } from 'react'
import { api } from '../lib/axios'
import { Plus, Trash2, Edit2, Video, FileText, ChevronDown, ChevronUp, Save, X } from 'lucide-react'

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

interface Course {
  id: string
  title: string
  description: string
  cover_url: string | null
  modules: Module[]
}

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const response = await api.get('/courses')
      // For each course, load modules and lessons
      const coursesWithDetails = await Promise.all(
        response.data.map(async (course: any) => {
          const detail = await api.get(`/courses/${course.id}`)
          return detail.data
        })
      )
      setCourses(coursesWithDetails)
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateCourse() {
    try {
      await api.post('/courses', newCourse)
      setNewCourse({ title: '', description: '' })
      setIsCreatingCourse(false)
      loadCourses()
    } catch (error) {
      console.error('Erro ao criar curso:', error)
    }
  }

  async function handleDeleteCourse(id: string) {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await api.delete(`/courses/${id}`)
        loadCourses()
      } catch (error) {
        console.error('Erro ao excluir curso:', error)
      }
    }
  }

  if (isLoading) return <div className="text-center p-12">Carregando...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
        <button
          onClick={() => setIsCreatingCourse(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Curso
        </button>
      </div>

      {isCreatingCourse && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 space-y-4">
          <h2 className="font-bold text-gray-900">Criar Novo Curso</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Título do Curso"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              className="border p-2 rounded-md w-full bg-white"
            />
            <textarea
              placeholder="Descrição"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              className="border p-2 rounded-md w-full bg-white h-24"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreatingCourse(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              onClick={handleCreateCourse}
              disabled={!newCourse.title}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Criar Curso
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => (
          <CourseManager key={course.id} course={course} onUpdate={loadCourses} onDelete={() => handleDeleteCourse(course.id)} />
        ))}
      </div>
    </div>
  )
}

function CourseManager({ course, onUpdate, onDelete }: { course: Course; onUpdate: () => void; onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')

  async function handleAddModule() {
    try {
      await api.post('/modules', { title: moduleTitle, course_id: course.id })
      setModuleTitle('')
      setIsAddingModule(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao adicionar módulo:', error)
    }
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await api.put(`/courses/${course.id}`, { cover_url: uploadRes.data.fileUrl })
      onUpdate()
    } catch (error) {
      console.error('Erro ao subir capa:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 flex items-center gap-6">
        <div className="w-32 aspect-video bg-gray-100 rounded overflow-hidden flex-shrink-0 relative group">
          {course.cover_url ? (
            <img src={course.cover_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Plus size={24} />
            </div>
          )}
          <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs text-center p-2">
            Alterar Capa
            <input type="file" className="hidden" accept="image/*" onChange={handleUploadCover} />
          </label>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-md" aria-label="Excluir curso">
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-md"
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-700 text-sm">Módulos</h4>
            {!isAddingModule && (
              <button
                onClick={() => setIsAddingModule(true)}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center"
              >
                <Plus size={14} className="mr-1" />
                Adicionar Módulo
              </button>
            )}
          </div>

          {isAddingModule && (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Título do Módulo"
                className="text-sm border rounded px-2 py-1 flex-1 bg-white"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
              />
              <button onClick={handleAddModule} className="bg-blue-600 text-white text-xs px-3 py-1 rounded">
                Salvar
              </button>
              <button onClick={() => setIsAddingModule(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {course.modules.map((module) => (
              <ModuleManager key={module.id} module={module} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleManager({ module, onUpdate }: { module: Module; onUpdate: () => void }) {
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')

  async function handleAddLesson() {
    try {
      await api.post('/lessons', { title: lessonTitle, module_id: module.id })
      setLessonTitle('')
      setIsAddingLesson(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao adicionar aula:', error)
    }
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-bold text-gray-800 text-sm">{module.title}</h5>
        <button
          onClick={() => setIsAddingLesson(true)}
          className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
        >
          + Aula
        </button>
      </div>

      <div className="space-y-2">
        {module.lessons.map((lesson) => (
          <LessonManager key={lesson.id} lesson={lesson} onUpdate={onUpdate} />
        ))}

        {isAddingLesson && (
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Título da Aula"
              className="text-xs border rounded px-2 py-1 flex-1 bg-white"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
            <button onClick={handleAddLesson} className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded">
              Ok
            </button>
            <button onClick={() => setIsAddingLesson(false)} className="text-gray-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function LessonManager({ lesson, onUpdate }: { lesson: Lesson; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [contentText, setContentText] = useState(lesson.content_text || '')

  async function handleSave() {
    try {
      await api.put(`/lessons/${lesson.id}`, { title, content_text: contentText })
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar aula:', error)
    }
  }

  async function handleUploadVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await api.put(`/lessons/${lesson.id}`, { video_url: uploadRes.data.fileUrl })
      onUpdate()
    } catch (error) {
      console.error('Erro ao subir vídeo:', error)
    }
  }

  async function handleDelete() {
    if (confirm('Excluir aula?')) {
      try {
        await api.delete(`/lessons/${lesson.id}`)
        onUpdate()
      } catch (error) {
        console.error('Erro ao excluir aula:', error)
      }
    }
  }

  return (
    <div className="bg-white p-3 rounded border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lesson.video_url ? (
            <Video size={16} className="text-blue-500" />
          ) : (
            <FileText size={16} className="text-gray-400" />
          )}
          {isEditing ? (
            <input
              className="text-xs border-b outline-none bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          ) : (
            <span className="text-xs font-medium text-gray-700">{lesson.title}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <button onClick={handleSave} className="p-1 text-green-600">
              <Save size={14} />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-blue-600">
              <Edit2 size={14} />
            </button>
          )}
          <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <textarea
            className="w-full text-xs border rounded p-1 h-16 bg-white"
            placeholder="Conteúdo em texto..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded cursor-pointer hover:bg-blue-100">
              {lesson.video_url ? 'Substituir Vídeo' : 'Subir Vídeo (.mp4)'}
              <input type="file" className="hidden" accept="video/mp4" onChange={handleUploadVideo} />
            </label>
            {lesson.video_url && <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{lesson.video_url.split('/').pop()}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
