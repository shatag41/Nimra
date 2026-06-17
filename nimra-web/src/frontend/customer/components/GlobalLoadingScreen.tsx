'use client';

import React from 'react';

export default function GlobalLoadingScreen() {
  return (
    <div className="global-loader-overlay">
      <div className="loader-content">
        {/* Animated Water Droplet SVG */}
        <div className="svg-container">
          <svg viewBox="0 0 100 120" width="80" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ripple Wave 1 */}
            <ellipse cx="50" cy="95" rx="35" ry="10" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="2" className="ripple ripple-1" />
            {/* Ripple Wave 2 */}
            <ellipse cx="50" cy="95" rx="35" ry="10" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="2.5" className="ripple ripple-2" />
            
            {/* Splash Droplets */}
            <circle cx="30" cy="80" r="3" fill="#2563eb" className="splash splash-left" />
            <circle cx="70" cy="80" r="2.5" fill="#2563eb" className="splash splash-right" />

            {/* Falling/Rippling Water Droplet */}
            <path 
              d="M50 20C50 20 32 50 32 68C32 77.9411 40.0589 86 50 86C59.9411 86 68 77.9411 68 68C68 50 50 20 50 20Z" 
              fill="url(#dropletGrad)" 
              className="water-drop"
            />

            <defs>
              <linearGradient id="dropletGrad" x1="50" y1="20" x2="50" y2="86" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 className="loader-title">NIMRA</h2>
        <p className="loader-subtitle">Pure Hydration...</p>
      </div>

      <style jsx>{`
        .global-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 0.3s ease-out forwards;
        }

        .loader-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .svg-container {
          position: relative;
          margin-bottom: 1.5rem;
        }

        /* Droplet Fall & Splash Animation */
        .water-drop {
          transform-origin: 50px 68px;
          animation: dropFall 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Ripple Animations */
        .ripple {
          transform-origin: 50px 95px;
          opacity: 0;
        }

        .ripple-1 {
          animation: rippleEffect 1.8s ease-out infinite;
          animation-delay: 0.9s;
        }

        .ripple-2 {
          animation: rippleEffect 1.8s ease-out infinite;
          animation-delay: 1.1s;
        }

        /* Splash Particles */
        .splash {
          opacity: 0;
          transform-origin: 50px 95px;
        }

        .splash-left {
          animation: splashLeftEffect 1.8s ease-out infinite;
          animation-delay: 0.9s;
        }

        .splash-right {
          animation: splashRightEffect 1.8s ease-out infinite;
          animation-delay: 0.95s;
        }

        .loader-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.1em;
          margin: 0;
          text-shadow: 0 0 15px rgba(37, 99, 235, 0.5);
          animation: textPulse 1.8s ease-in-out infinite;
        }

        .loader-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.4rem;
          letter-spacing: 0.05em;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes textPulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
            color: #3b82f6;
          }
        }

        @keyframes dropFall {
          0% {
            transform: translateY(-80px) scaleY(0.9);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          45% {
            transform: translateY(0) scaleY(1.05) scaleX(0.95);
          }
          50% {
            transform: translateY(5px) scaleY(0.7) scaleX(1.3);
          }
          60% {
            transform: translateY(-10px) scaleY(1.1) scaleX(0.9);
          }
          70% {
            transform: translateY(0) scale(1);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
        }

        @keyframes rippleEffect {
          0% {
            transform: scale(0.2);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes splashLeftEffect {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          45% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          80% {
            transform: translate(-25px, -30px) scale(0.4);
            opacity: 0.8;
          }
          100% {
            transform: translate(-30px, -35px) scale(0.1);
            opacity: 0;
          }
        }

        @keyframes splashRightEffect {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          45% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          80% {
            transform: translate(20px, -25px) scale(0.4);
            opacity: 0.8;
          }
          100% {
            transform: translate(25px, -30px) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
