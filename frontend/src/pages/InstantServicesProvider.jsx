// Provider version of Instant Services page
import React from 'react';
import InstantServices from './InstantServices';

const InstantServicesProvider = () => {
  // You can add provider-specific logic/props here
  return <InstantServices userRole="provider" />;
};

export default InstantServicesProvider;
