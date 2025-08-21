import React from 'react';
import useRealtimeNegotiations from '../hooks/useRealtimeNegotiations';
import { useAuth } from '../context/AuthContext';

const NegotiationsBadge = () => {
    const { isAuthenticated } = useAuth();
    const { getActiveCount } = useRealtimeNegotiations('active', 'all', 10000); // Poll every 10 seconds for badge

    if (!isAuthenticated) return null;

    const count = getActiveCount();
    
    if (count === 0) return null;

    return (
        <span className="negotiations-badge">
            {count > 9 ? '9+' : count}
            <style jsx>{`
                .negotiations-badge {
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    color: white;
                    border-radius: 50%;
                    padding: 0.2rem 0.4rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    position: absolute;
                    top: -5px;
                    right: -8px;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    animation: pulse-badge 2s infinite;
                }

                @keyframes pulse-badge {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </span>
    );
};

export default NegotiationsBadge;
