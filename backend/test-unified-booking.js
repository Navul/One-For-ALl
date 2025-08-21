// Test script to verify unified booking system works
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testUnifiedBooking() {
    try {
        console.log('🧪 Testing unified booking system...');
        
        // Test basic endpoint availability
        const testResponse = await axios.get(`${API_BASE_URL}/api/bookings/test`);
        console.log('✅ Booking routes test:', testResponse.data);
        
        // Test booking creation endpoint (will fail due to auth, but should reach the endpoint)
        try {
            const bookingResponse = await axios.post(`${API_BASE_URL}/api/bookings`, {
                serviceId: 'test123',
                date: new Date().toISOString(),
                location: 'Test Location',
                notes: 'Test booking'
            });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Booking endpoint reachable (401 = auth required, expected)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUnifiedBooking();
