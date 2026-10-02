import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { findMethod } from './data/methods'
import MethodSelect from './screens/MethodSelect'
import Calculator from './screens/Calculator'
import GrindGuide from './screens/GrindGuide'
import Timer from './screens/Timer'
import ComingSoon from './screens/ComingSoon'
import NotFound from './screens/NotFound'

function CalculatorRoute() {
  const { methodId } = useParams()
  const method = findMethod(methodId)
  if (!method) return <Navigate to="/" replace />
  // Keyed so switching methods starts from that method's defaults.
  return <Calculator key={method.id} method={method} />
}

function TimerRoute() {
  const { methodId } = useParams()
  const method = findMethod(methodId)
  if (!method) return <Navigate to="/" replace />
  return <Timer key={method.id} method={method} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MethodSelect />} />
      <Route path="/seduh/:methodId" element={<CalculatorRoute />} />
      <Route path="/seduh/:methodId/timer" element={<TimerRoute />} />
      <Route path="/gilingan" element={<GrindGuide />} />
      <Route path="/resep" element={<ComingSoon titleKey="recipes.title" />} />
      <Route path="/pengaturan" element={<ComingSoon titleKey="settings.title" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
