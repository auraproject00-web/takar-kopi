import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { findMethod } from './data/methods'
import MethodSelect from './screens/MethodSelect'
import Calculator from './screens/Calculator'
import GrindGuide from './screens/GrindGuide'
import Timer from './screens/Timer'
import RecipeList from './screens/RecipeList'
import RecipeForm from './screens/RecipeForm'
import { getRecipe } from './lib/recipes'
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

function NewRecipeRoute() {
  const [search] = useSearchParams()
  const method = findMethod(search.get('metode') ?? undefined)
  if (!method) return <Navigate to="/" replace />
  return <RecipeForm method={method} search={search} />
}

function EditRecipeRoute() {
  const { recipeId = '' } = useParams()
  // null while loading, so "not found" is only shown once the lookup is done.
  const recipe = useLiveQuery(async () => (await getRecipe(recipeId)) ?? 'missing', [recipeId], null)
  if (recipe === null) return null
  const method = recipe === 'missing' ? undefined : findMethod(recipe.methodId)
  if (recipe === 'missing' || !method) return <NotFound titleKey="recipe.notFound" />
  return <RecipeForm key={recipe.id} method={method} search={new URLSearchParams()} existing={recipe} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MethodSelect />} />
      <Route path="/seduh/:methodId" element={<CalculatorRoute />} />
      <Route path="/seduh/:methodId/timer" element={<TimerRoute />} />
      <Route path="/gilingan" element={<GrindGuide />} />
      <Route path="/resep" element={<RecipeList />} />
      <Route path="/resep/baru" element={<NewRecipeRoute />} />
      <Route path="/resep/:recipeId/ubah" element={<EditRecipeRoute />} />
      <Route path="/pengaturan" element={<ComingSoon titleKey="settings.title" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
