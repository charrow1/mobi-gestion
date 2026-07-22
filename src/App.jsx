import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { LOCALES } from './lib/constants'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import LocalesPage from './pages/LocalesPage'
import VendedoresPage from './pages/VendedoresPage'
import ProveedoresPage from './pages/ProveedoresPage'
import TareasPage from './pages/TareasPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)', fontSize: 13 }}>Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppInner() {
  const [tab, setTab] = useState('locales')
  const [localActivo, setLocalActivo] = useState(LOCALES[0])
  const [vendedores, setVendedores] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [temasData, setTemasData] = useState([])
  const [tareasBadge, setTareasBadge] = useState(0)

  useEffect(() => {
    supabase.from('vendedores').select('*').order('nombre').then(({ data }) => setVendedores(data || []))
    supabase.from('proveedores').select('*').order('nombre').then(({ data }) => setProveedores(data || []))
    supabase.from('temas').select('*').order('fecha', { ascending: false }).then(({ data }) => setTemasData(data || []))
  }, [])

  // Recargar temas cada vez que el usuario entra a la pestaña vendedores
  useEffect(() => {
    if (tab === 'vendedores') {
      supabase.from('temas').select('*').order('fecha', { ascending: false }).then(({ data }) => setTemasData(data || []))
    }
  }, [tab])

  const subtabs = tab === 'locales' ? LOCALES.map(l => ({ key: l, label: l })) : []
  const activeSubtab = tab === 'locales' ? localActivo : undefined

  function handleTabChange(newTab) {
    setTab(newTab)
  }

  function handleSubtabChange(key) {
    if (tab === 'locales') setLocalActivo(key)
  }

  return (
    <Layout activeTab={tab} onTabChange={handleTabChange} subtabs={subtabs} activeSubtab={activeSubtab} onSubtabChange={handleSubtabChange} tareasBadge={tareasBadge}>
      {tab === 'locales' && (
        <LocalesPage
          localActivo={localActivo}
          vendedores={vendedores}
        />
      )}
      {tab === 'vendedores' && (
        <VendedoresPage
          vendedores={vendedores}
          setVendedores={setVendedores}
          temasData={temasData}
        />
      )}
      {tab === 'proveedores' && (
        <ProveedoresPage
          proveedores={proveedores}
          setProveedores={setProveedores}
        />
      )}
      {tab === 'tareas' && (
        <TareasPage onBadgeChange={setTareasBadge} />
      )}
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<PrivateRoute><AppInner /></PrivateRoute>} />
    </Routes>
  )
}
