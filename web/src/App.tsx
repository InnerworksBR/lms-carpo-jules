import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.js'
import { LoginPage } from './pages/LoginPage.js'
import { Dashboard } from './pages/Dashboard.js'
import { ProtectedRoute } from './routes/ProtectedRoute.js'
import { Layout } from './components/Layout.js'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            {/* Adicione outras rotas protegidas aqui */}
            <Route path="/courses" element={<Layout><div>Página de Cursos (Fase 4)</div></Layout>} />
            <Route path="/users" element={<Layout><div>Gestão de Usuários (Em breve)</div></Layout>} />
            <Route path="/settings" element={<Layout><div>Configurações (Em breve)</div></Layout>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
