import RecipeGenerator from './components/RecipeGenerator'
import BackgroundAnimation from './components/BackgroundAnimation'

function App() {
  return (
    <>
      <BackgroundAnimation />
      <main className="relative min-h-screen">
        <div className="z-10 relative">
          <RecipeGenerator />
        </div>
      </main>
    </>
  )
}

export default App