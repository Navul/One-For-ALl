import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  const openModal = (modalType, data = null) => {
    // Close any existing modal before opening a new one
    closeModal();
    setActiveModal(modalType);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const isModalOpen = (modalType) => {
    return activeModal === modalType;
  };

  return (
    <ModalContext.Provider value={{
      activeModal,
      modalData,
      openModal,
      closeModal,
      isModalOpen
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContext;
