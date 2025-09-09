import { useState, useEffect } from 'react';

const useProviderRating = (providerId) => {
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!providerId) return;

    const fetchProviderRating = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/reviews/provider/${providerId}/rating`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch provider rating: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setRating(data.data);
        } else {
          setError(data.message || 'Failed to fetch provider rating');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching provider rating:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderRating();
  }, [providerId]);

  return { rating, loading, error };
};

export default useProviderRating;
