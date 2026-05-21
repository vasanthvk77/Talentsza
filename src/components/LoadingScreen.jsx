import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ isVisible }) => {
  return (
    <div className={`loading-screen ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="loading-content">
        <div className="logo-container">
          <img src="/TalentszaLog.svg" alt="Talentsza Logo" className="loading-logo" />
          <div className="logo-shimmer"></div>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
        <div className="loading-text">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
