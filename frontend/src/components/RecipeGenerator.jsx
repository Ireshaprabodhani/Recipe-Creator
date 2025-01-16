import { useState } from 'react'
import axios from 'axios'
import { 
  Plus, 
  X, 
  RefreshCw, 
  ChevronLeft, 
  Tag, 
  ChefHat, 
  Sparkles,
  ShoppingBag,
  ClipboardList,
  Lightbulb,
  Clock,
  Users,
  Activity,
} from 'lucide-react'
import FlipBook from '../components/FlipBook'


const API_URL = 'https://inkqxdx9em.ap-southeast-1.awsapprunner.com/api'

const RecipeGenerator = () => {
  const [ingredients, setIngredients] = useState([])
  const [currentIngredient, setCurrentIngredient] = useState('')
  const [recipes, setRecipes] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [recipeDetails, setRecipeDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState('ingredients')
  const [currentRecipePage, setCurrentRecipePage] = useState(0);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()])
      setCurrentIngredient('')
    }
  }

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentIngredient.trim()) {
      handleAddIngredient()
    }
  }

  const handlePageChange = (page) => {
    setCurrentRecipePage(page);
  };

  const handleGenerateRecipes = async () => {
    try {
      setLoading(true)
      setError(null)
      if (ingredients.length < 2) {
        setError('Please add at least 2 ingredients')
        return
      }
      
      const payload = {
        ingredients: ingredients
      }
      
      console.log('Sending payload:', payload) // Add this debug log
      
      const response = await axios.post(`${API_URL}/generate-recipes`, payload)
      
      if (response.data && response.data.recipes) {
        const recipesWithTime = response.data.recipes.map(recipe => {
          const timeMatch = recipe.content?.match(/cooking time:?\s*(\d+)\s*minutes/i);
          return {
            ...recipe,
            cookingTime: timeMatch ? `${timeMatch[1]} minutes` : '20 minutes'
          };
        });
        setRecipes(recipesWithTime)
        setStage('recipes')
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (err) {
      console.error('Generate recipes error:', err)
      // Enhanced error handling
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to generate recipes. Please try again.'
      console.log('Full error details:', err.response?.data) // Add this debug log
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRecipe = async (recipe) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recipe details and nutrition info in parallel
      const [recipeResponse, nutritionResponse] = await Promise.all([
        axios.post(`${API_URL}/recipe-details`, {
          recipeName: recipe.name,
          ingredients: ingredients
        }),
        axios.post(`${API_URL}/nutrition-info`, {
          recipeName: recipe.name,
          ingredients: ingredients
        })
      ]);
  
      const recipeWithDetails = {
        ...recipe,
        ...recipeResponse.data,
        nutritionAnalysis: nutritionResponse.data.nutritionInfo,
        imageUrl: recipe.imageUrl
      };
  
      setRecipeDetails(recipeWithDetails);
      setSelectedRecipe(recipe);
      setStage('details');
    } catch (err) {
      console.error('Error getting recipe details:', err);
      setError('Failed to get recipe details');
    } finally {
      setLoading(false);
    }
  };

  const parseRecipeContent = (content) => {
    if (!content) return { 
      ingredients: [], 
      instructions: [], 
      cookingTime: '20 minutes', 
      prepTime: '10 minutes',
      servings: '2 portions' 
    };
    
    const sections = content.split('\n\n');
    let ingredients = [];
    let instructions = [];
    let cookingTime = '20 minutes';  // default value
    let prepTime = '10 minutes';     // default value
    let servings = '2 portions';     // default value
    
    sections.forEach(section => {
      if (section.toLowerCase().includes('ingredients')) {
        ingredients = section
          .split('\n')
          .slice(1)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (section.toLowerCase().includes('preparation') || 
                section.toLowerCase().includes('instructions')) {
        instructions = section
          .split('\n')
          .slice(1)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      // Extract cooking and prep times if present
      if (section.toLowerCase().includes('cooking time')) {
        const timeMatch = section.match(/(\d+)\s*minutes?/i);
        if (timeMatch) {
          cookingTime = `${timeMatch[1]} minutes`;
        }
      }
      if (section.toLowerCase().includes('preparation time') || section.toLowerCase().includes('prep time')) {
        const timeMatch = section.match(/(\d+)\s*minutes?/i);
        if (timeMatch) {
          prepTime = `${timeMatch[1]} minutes`;
        }
      }
      if (section.toLowerCase().includes('servings')) {
        const servingsMatch = section.match(/(\d+)\s*portions?/i);
        if (servingsMatch) {
          servings = `${servingsMatch[1]} portions`;
        }
      }
    });

    return { ingredients, instructions, cookingTime, prepTime, servings };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0" 
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.5)', // Darkened from 0.9 to 0.5
        }}
     />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChefHat className="w-12 h-12 text-indigo-600" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Recipe Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg flex items-center justify-center gap-2">
            Transform your ingredients into culinary masterpieces
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 relative animate-fade-in">
            {error}
            <button 
              onClick={() => setError(null)}
              className="absolute top-2 right-2 text-red-700 hover:text-red-900 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Ingredients Stage */}
        {stage === 'ingredients' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-white/20">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Your Ingredients</h2>
              <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {ingredients.length} added
              </span>
            </div>

            {/* Ingredients Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {ingredients.map((ingredient, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  <Tag size={14} className="text-indigo-500" />
                  <span className="font-medium">{ingredient}</span>
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-indigo-400 hover:text-indigo-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div className="flex gap-3 mb-8">
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add an ingredient..."
                className="flex-grow p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-700 bg-gray-50"
              />
              <button
                onClick={handleAddIngredient}
                disabled={!currentIngredient.trim()}
                className="bg-indigo-500 text-white px-6 py-4 rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateRecipes}
              disabled={ingredients.length < 2 || loading}
              className={`w-full p-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
                ingredients.length < 2 || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transform hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin" />
                  Creating Your Recipe Book...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  Generate Recipes
                </span>
              )}
            </button>
          </div>
        )}

        {/* Recipes Stage */}
        {stage === 'recipes' && recipes && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <button
              onClick={() => setStage('ingredients')}
              className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Ingredients
            </button>
            
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Your Recipe Book</h2>

            <FlipBook 
            recipes={recipes} 
            onSelectRecipe={handleSelectRecipe}
            initialPage={currentRecipePage}
            onPageChange={handlePageChange}
          />
          </div>
        )}

        {/* Recipe Details Stage */}
        {stage === 'details' && recipeDetails && selectedRecipe && (
          <div className="animate-fade-in">
            <button
              onClick={() => setStage('recipes')}
              className="mb-6 flex items-center gap-2 text-white hover:text-indigo-200 transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Recipe Book
            </button>
            
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
              {/* Recipe Hero Section */}
              <div className="w-full h-72 relative">
                <img
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h1 className="absolute bottom-6 left-6 text-4xl font-bold text-white">
                  {selectedRecipe.name}
                </h1>
              </div>

              {/* Recipe Content */}
              <div className="p-8">
                {/* Recipe Info Cards */}
                <div className="flex gap-4 mb-8">
                  <div className="bg-indigo-50 rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span className="text-indigo-600 font-medium">Prep Time</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {parseRecipeContent(recipeDetails.recipe).prepTime}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-600 font-medium">Cooking Time</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {parseRecipeContent(recipeDetails.recipe).cookingTime}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-600 font-medium">Servings</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {parseRecipeContent(recipeDetails.recipe).servings}
                    </div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-indigo-500" />
                    Ingredients
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parseRecipeContent(recipeDetails.recipe).ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Instructions Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-500" />
                    Instructions
                  </h2>
                  <div className="space-y-4">
                    {parseRecipeContent(recipeDetails.recipe).instructions.map((step, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 flex-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-yellow-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-800">Chef's Tips</h3>
                  </div>
                  <p className="text-yellow-800">
                    For best results, use fresh ingredients and serve immediately.
                  </p>
                </div>

                {/* Nutrition Information Section */}
                <div className="mt-8 bg-green-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-semibold text-green-800">Nutritional Information</h3>
                  </div>
                  
                  {recipeDetails.nutritionAnalysis && (
                    <div className="space-y-4">
                      {/* Parse and display nutrition information */}
                      {recipeDetails.nutritionAnalysis.split('\n').map((line, index) => {
                        if (line.trim()) {
                          if (line.includes(':')) {
                            const [label, value] = line.split(':');
                            return (
                              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-medium text-green-700 min-w-[200px]">
                                  {label.trim()}:
                                </span>
                                <span className="text-green-800">
                                  {value.trim()}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <p key={index} className="text-green-800">
                                {line.trim()}
                              </p>
                            );
                          }
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl flex items-center gap-3 shadow-2xl">
              <RefreshCw className="animate-spin text-indigo-600" />
              <span className="text-gray-700 font-medium">
                {stage === 'details' ? 'Preparing recipe details...' : 'Creating your recipe book...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeGenerator

