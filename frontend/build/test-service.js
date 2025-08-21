// Quick test to add a sample service
const addTestService = async () => {
    try {
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Test Cleaning Service',
                description: 'Test service for instant booking',
                category: 'cleaning',
                price: 50,
                duration: 120,
                location: {
                    type: 'Point',
                    coordinates: [90.4125, 23.8103] // Dhaka coordinates
                },
                instantService: true,
                serviceRadius: 10,
                estimatedDuration: '2 hours',
                isActive: true
            })
        });

        const data = await response.json();
        console.log('Test service added:', data);
    } catch (error) {
        console.error('Error adding test service:', error);
    }
};

// Run this in the browser console
addTestService();
