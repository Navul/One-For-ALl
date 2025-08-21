import { useState, useEffect, useCallback } from 'react';
import { getUserNegotiations } from '../services/negotiationService';

const useRealtimeNegotiations = (activeTab = 'all', typeFilter = 'all', pollingInterval = 5000) => {
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const fetchNegotiations = useCallback(async (showLoader = false) => {
        try {
            if (showLoader) {
                setLoading(true);
            }
            setError('');
            
            const response = await getUserNegotiations(activeTab, typeFilter);
            setNegotiations(response.negotiations);
            setLastUpdated(Date.now());
        } catch (error) {
            console.error('Error fetching negotiations:', error);
            setError(error.message);
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, [activeTab, typeFilter]);

    // Initial load
    useEffect(() => {
        fetchNegotiations(true);
    }, [fetchNegotiations]);

    // Real-time polling
    useEffect(() => {
        if (pollingInterval <= 0) return;

        const interval = setInterval(() => {
            fetchNegotiations(false); // Background fetch without loader
        }, pollingInterval);

        return () => clearInterval(interval);
    }, [fetchNegotiations, pollingInterval]);

    // Manual refresh function
    const refreshNegotiations = useCallback(() => {
        fetchNegotiations(true);
    }, [fetchNegotiations]);

    // Get active negotiations count for navbar badge
    const getActiveCount = useCallback(() => {
        return negotiations.filter(n => n.status === 'active').length;
    }, [negotiations]);

    // Check if there are new negotiations since last check
    const hasNewNegotiations = useCallback((lastCheck) => {
        return negotiations.some(n => 
            new Date(n.createdAt) > new Date(lastCheck) && n.status === 'active'
        );
    }, [negotiations]);

    return {
        negotiations,
        loading,
        error,
        lastUpdated,
        refreshNegotiations,
        getActiveCount,
        hasNewNegotiations,
        setError
    };
};

export default useRealtimeNegotiations;
