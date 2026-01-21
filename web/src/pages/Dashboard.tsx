import { useAuth } from '../hooks/useAuth.js'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Olá, {user?.name}!</h1>
        <p className="text-slate-500">Acompanhe seus cursos e progresso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-sm font-medium text-slate-500 block mb-1">Cursos em Andamento</span>
          <span className="text-3xl font-bold text-slate-900">0</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-sm font-medium text-slate-500 block mb-1">Aulas Concluídas</span>
          <span className="text-3xl font-bold text-slate-900">0</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-sm font-medium text-slate-500 block mb-1">Média de Progresso</span>
          <span className="text-3xl font-bold text-slate-900">0%</span>
        </div>
      </div>
    </div>
  )
}
