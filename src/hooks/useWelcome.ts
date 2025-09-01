import { useState, useEffect } from 'react';

const WELCOME_STORAGE_KEY = 'borabuz-welcome-shown';

export const useWelcome = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    setShowWelcome(false);
  };

  return {
    showWelcome,
    closeWelcome
  };
};
