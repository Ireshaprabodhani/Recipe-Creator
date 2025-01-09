import React from 'react';

const foodItems = [
  { emoji: '🍕', color: '#ff6b6b' },
  { emoji: '🍔', color: '#ffd93d' },
  { emoji: '🥗', color: '#95e1d3' },
  { emoji: '🍝', color: '#f38181' },
  { emoji: '🍜', color: '#fce38a' },
  { emoji: '🍣', color: '#eaffd0' },
  { emoji: '🥐', color: '#ffd3b6' },
  { emoji: '🧁', color: '#ffaaa5' },
  { emoji: '🍰', color: '#ff8b94' },
  { emoji: '🥪', color: '#dcedc1' },
  { emoji: '🍦', color: '#a8e6cf' },
  { emoji: '🥨', color: '#ffd3b6' },
  { emoji: '🥞', color: '#ffb174' },
  { emoji: '🌮', color: '#ffc75f' },
  { emoji: '🍪', color: '#e3b04b' },
];

const BackgroundAnimation = () => {
  // Generate fixed number of food items with pre-calculated positions
  const generateFoodItems = (count = 30) => {
    return Array.from({ length: count }, (_, index) => {
      const foodItem = foodItems[Math.floor(Math.random() * foodItems.length)];
      return {
        ...foodItem,
        id: index,
        left: `${Math.random() * 100}%`,
        animationDuration: `${15 + Math.random() * 10}s`,
        animationDelay: `-${Math.random() * 15}s`,
        fontSize: `${30 + Math.random() * 20}px`,
      };
    });
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="absolute inset-0 opacity-30 bg-grid-pattern"></div>
      
      {generateFoodItems().map((item) => (
        <div
          key={item.id}
          className="food-item absolute"
          style={{
            left: item.left,
            fontSize: item.fontSize,
            animation: `float ${item.animationDuration} linear infinite`,
            animationDelay: item.animationDelay,
          }}
        >
          <div 
            className="relative hover:scale-150 transition-transform duration-300"
            style={{
              filter: `drop-shadow(0 0 8px ${item.color})`
            }}
          >
            {item.emoji}
            <div
              className="absolute inset-0 blur-md"
              style={{
                background: `radial-gradient(circle at center, ${item.color}33, transparent 70%)`,
                transform: 'scale(1.5)',
                zIndex: -1
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackgroundAnimation;