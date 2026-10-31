import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import RequireAuth from './components/RequireAuth'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import MakeDetail from './pages/MakeDetail'
import MakeForm from './pages/MakeForm'
import NewMake from './pages/NewMake'
import PatternDetail from './pages/PatternDetail'
import PatternForm from './pages/PatternForm'
import PatternList from './pages/PatternList'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<PatternList />} />
        <Route path="patterns/new" element={<PatternForm />} />
        <Route path="patterns/:id" element={<PatternDetail />} />
        <Route path="patterns/:id/edit" element={<PatternForm />} />
        <Route path="patterns/:id/makes/new" element={<NewMake />} />
        <Route path="makes/:id" element={<MakeDetail />} />
        <Route path="makes/:id/edit" element={<MakeForm />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
