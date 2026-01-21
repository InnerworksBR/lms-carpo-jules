import { Routes, Route } from 'react-router-dom'
import { Login } from '../pages/Login'
import { Dashboard } from '../pages/Dashboard'
import { LessonPlayer } from '../pages/LessonPlayer'
import { CourseList } from '../pages/admin/CourseList'
import { CourseForm } from '../pages/admin/CourseForm'
import { DefaultLayout } from '../layouts/DefaultLayout'
import { PrivateRoute } from '../components/PrivateRoute'

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin/courses" element={<CourseList />} />
          <Route path="/admin/courses/new" element={<CourseForm />} />
          <Route path="/admin/courses/:id" element={<CourseForm />} />
        </Route>

        <Route path="/courses/:courseId" element={<LessonPlayer />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayer />} />
      </Route>
    </Routes>
  )
}
