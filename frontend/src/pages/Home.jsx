import React from 'react';
import ServiceList from '../components/ServiceList';

const Home = () => {
    return (
        <div>
            <h1>Welcome to LocalConnect</h1>
            <p>Your one-stop directory for local services.</p>
            <ServiceList />
        </div>
    );
};

export default Home;