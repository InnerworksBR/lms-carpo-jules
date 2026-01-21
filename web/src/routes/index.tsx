import { Routes, Route } from 'react-router-dom'
import { Login } from '../pages/Login'
import { Dashboard } from '../pages/Dashboard'
import { DefaultLayout } from '../layouts/DefaultLayout'
import { PrivateRoute } from '../components/PrivateRoute'

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Dashboard />} />
          {/* Outras rotas virão aqui */}
        </Route>
      </Route>
    </Routes>
  )
}
