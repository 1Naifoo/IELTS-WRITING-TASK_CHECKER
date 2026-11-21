import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import History from './pages/History'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ResultPage from './pages/ResultPage'
import Settings from './pages/Settings'
import Task1 from './pages/Task1'
import Task2 from './pages/Task2'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="task1" element={<Task1 />} />
        <Route path="task2" element={<Task2 />} />
        <Route path="results" element={<History />} />
        <Route path="results/:id" element={<ResultPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
