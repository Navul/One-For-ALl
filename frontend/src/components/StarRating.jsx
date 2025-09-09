import React from 'react';

const StarRating = ({ 
  rating = 0, 
  totalReviews = 0, 
  size = 'small', 
  showCount = true,
  showEmptyStars = true 
}) => {
  // Ensure rating is a number and within bounds
  const numRating = parseFloat(rating) || 0;
  const validRating = Math.max(0, Math.min(5, numRating));
  
  // Size configurations
  const sizeConfig = {
    small: {
      starSize: '14px',
      fontSize: '0.75rem',
      gap: '2px'
    },
    medium: {
      starSize: '18px',
      fontSize: '0.85rem',
      gap: '3px'
    },
    large: {
      starSize: '24px',
      fontSize: '1rem',
      gap: '4px'
    }
  };
  
  const config = sizeConfig[size] || sizeConfig.small;
  
  // Generate star display
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(validRating);
    const hasHalfStar = validRating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span 
          key={`full-${i}`}
          style={{ 
            color: '#ffc107', 
            fontSize: config.starSize,
            lineHeight: 1
          }}
        >
          ★
        </span>
      );
    }
    
    // Half star
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <span 
          key="half"
          style={{ 
            position: 'relative',
            fontSize: config.starSize,
            lineHeight: 1,
            color: '#e0e0e0' // Empty star color
          }}
        >
          ★
          <span 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              overflow: 'hidden',
              color: '#ffc107'
            }}
          >
            ★
          </span>
        </span>
      );
    }
    
    // Empty stars (only if showEmptyStars is true)
    if (showEmptyStars) {
      const emptyStarsCount = 5 - fullStars - (hasHalfStar ? 1 : 0);
      for (let i = 0; i < emptyStarsCount; i++) {
        stars.push(
          <span 
            key={`empty-${i}`}
            style={{ 
              color: '#e0e0e0', 
              fontSize: config.starSize,
              lineHeight: 1
            }}
          >
            ★
          </span>
        );
      }
    }
    
    return stars;
  };
  
  // Don't render anything if no rating and showEmptyStars is false
  if (!showEmptyStars && validRating === 0) {
    return null;
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: config.gap
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1px'
      }}>
        {renderStars()}
      </div>
      
      {showCount && (totalReviews > 0 || validRating > 0) && (
        <span style={{
          fontSize: config.fontSize,
          color: '#6b7280',
          marginLeft: '4px'
        }}>
          {validRating > 0 && `${validRating.toFixed(1)}`}
          {totalReviews > 0 && ` (${totalReviews})`}
        </span>
      )}
      
      {/* Show "No reviews" if no rating and no reviews */}
      {showCount && totalReviews === 0 && validRating === 0 && (
        <span style={{
          fontSize: config.fontSize,
          color: '#9ca3af',
          marginLeft: '4px'
        }}>
          No reviews
        </span>
      )}
    </div>
  );
};

export default StarRating;
