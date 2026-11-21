import { Route, Routes } from 'react-router-dom'
import TownMap from './game/TownMap'
import About from './pages/About'
import Contact from './pages/Contact'
import Projects from './pages/Projects'
import Resume from './pages/Resume'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TownMap />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  )
}

export default App
