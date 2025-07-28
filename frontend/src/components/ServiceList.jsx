import React, { useEffect, useState } from 'react';

const ServiceList = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/services');
                const data = await response.json();
                setServices(data);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchServices();
    }, []);

    const servicesArray = Array.isArray(services) ? services : [];
    return (
        <div>
            <h2>Available Services</h2>
            <ul>
                {servicesArray.map(service => (
                    <li key={service._id}>
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                        <p>Provider: {service.provider}</p>
                        <p>Availability: {service.availability}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ServiceList;