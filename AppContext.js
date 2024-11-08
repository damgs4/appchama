import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [presenca, setPresenca] = useState({});
  const [justificativa, setJustificativa] = useState({});

  return (
    <AppContext.Provider value={{ presenca, setPresenca, justificativa, setJustificativa }}>
      {children}
    </AppContext.Provider>
  );
};
