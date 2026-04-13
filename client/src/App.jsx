import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Boards from './pages/Boards'
import Kanban from './pages/Kanban'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/boards" element={<Boards />} />
      <Route path="/boards/:id" element={<Kanban />} />
      <Route path="/" element={<Navigate to="/boards" replace />} />
    </Routes>
  )
}

export default App
