import React, { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Clock, BarChart, ChefHat, Book, Bookmark } from 'lucide-react';

const FlipPage = React.forwardRef((props, ref) => {
  const { recipe, onSelectRecipe } = props;
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`demoPage ${isLoaded ? 'loaded' : ''}`} ref={ref}>
      <div className="content bg-white h-full w-full p-4 rounded-lg">
        {/* Image Section */}
        <div className="image-container w-full h-40 relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
          {!imageError ? (
            <img
              src={`http://localhost:5000/images/${recipe.name.toLowerCase().replace(/ /g, '_')}.png`}
              alt={recipe.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span>Recipe Image</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col h-[calc(100%-11rem)]"> {/* Adjust height to ensure button fits */}
          <h2 className="text-xl font-bold mb-2 text-gray-800">{recipe.name}</h2>
          <p className="text-gray-600 text-sm mb-3 flex-grow">
            {recipe.description}
          </p>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 mr-1" />
              <span>{recipe.cookingTime}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              <BarChart className="w-4 h-4 mr-1" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>

          {/* View Recipe Button */}
          <button
            onClick={() => onSelectRecipe(recipe)}
            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 
                     text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 
                     transform hover:scale-[1.02] active:scale-98
                     transition-all duration-300 shadow-md hover:shadow-lg 
                     text-sm font-medium"
          >
            View Full Recipe
          </button>
        </div>
      </div>
    </div>
  );
});

const CoverPage = React.forwardRef((props, ref) => {
  return (
    <div className="cover-page" ref={ref}>
      <div className="cover-content">
        <div className="cover-pattern" />
        <Book className="cover-icon" />
        <div className="cover-text">
          <h1 className="cover-title">{props.children}</h1>
          <p className="cover-subtitle">A Collection of Culinary Delights</p>
          <div className="cover-divider" />
        </div>
        <div className="corner-decoration top-left" />
        <div className="corner-decoration top-right" />
        <div className="corner-decoration bottom-left" />
        <div className="corner-decoration bottom-right" />
      </div>
    </div>
  );
});

const FlipBook = ({  recipes, onSelectRecipe, initialPage = 0, onPageChange  }) => {
  const bookRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePageFlip = (e) => {
    setCurrentPage(e.data);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="recipe-book-wrapper">
      <div className="book-header">
        <h1 className="book-title">Culinary Treasures</h1>
        <p className="book-subtitle">Discover the art of cooking</p>
      </div>

      
      
      <div className={`book-container ${isLoading ? 'loading' : ''}`}>
        <HTMLFlipBook
          width={400}
          height={600}
          size="stretch"
          minWidth={315}
          maxWidth={400}
          minHeight={400}
          maxHeight={560}
          drawShadow={true}
          flippingTime={1000}
          className="flip-book"
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handlePageFlip}
          ref={bookRef}
          style={{ margin: '0 auto' }}
        >
          <CoverPage>Your Recipe Book</CoverPage>
          
          {recipes.map((recipe, index) => (
            <FlipPage 
              key={index}
              recipe={recipe}
              onSelectRecipe={onSelectRecipe}
              pageNumber={index + 1}
            />
          ))}

          <CoverPage>Bon Appétit!</CoverPage>
        </HTMLFlipBook>

        <div className="page-indicator">
          Page {currentPage + 1} of {recipes.length + 2}
        </div>
      </div>
    </div>
  );
};

export default FlipBook;