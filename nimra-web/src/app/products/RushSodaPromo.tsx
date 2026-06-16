import React from 'react';

export default function RushSodaPromo() {
  return (
    <div className="rush-promo-container animate-fade-in">
      {/* Background Floating Bubbles */}
      <div className="bubble bubble-1"></div>
      <div className="bubble bubble-2"></div>
      <div className="bubble bubble-3"></div>
      <div className="bubble bubble-4"></div>
      <div className="bubble bubble-5"></div>

      <div className="promo-wrapper">
        <div className="promo-main-row">
          <div className="promo-text-content">
            <div className="promo-badge">
              🚀 COMING SOON
            </div>
            
            <h2 className="promo-headline">RUSH Soda is Coming Soon!</h2>
            <p className="promo-subheading">
              Get ready for a refreshing new experience. Exciting flavors and sparkling refreshment are on the way.
            </p>

            <div className="launch-banner">
              <span className="pulse-dot"></span>
              Launching Soon Across Pune
            </div>

            <div className="compact-features">
              <div className="compact-feature glassmorphism">
                <div className="feature-icon">💧</div>
                <span>Refreshing</span>
              </div>
              <div className="compact-feature glassmorphism">
                <div className="feature-icon">✨</div>
                <span>Premium</span>
              </div>
              <div className="compact-feature glassmorphism">
                <div className="feature-icon">🌈</div>
                <span>Flavors</span>
              </div>
              <div className="compact-feature glassmorphism">
                <div className="feature-icon">🚀</div>
                <span>Soon</span>
              </div>
            </div>
          </div>

          <div className="promo-graphic-content">
            <div className="main-graphic-container">
              <div className="glow-effect"></div>
              <img 
                src="/rush-soda-can-new.png" 
                alt="RUSH Soda Premium Can" 
                className="soda-can floating-animation"
              />
            </div>
          </div>
        </div>

        <div className="compact-flavors-grid">
          <div className="flavor-card glassmorphism cola">
            <div className="flavor-accent"></div>
            <h4>Cola Blast</h4>
            <p>Classic cola with a twist.</p>
          </div>
          <div className="flavor-card glassmorphism orange">
            <div className="flavor-accent"></div>
            <h4>Orange Spark</h4>
            <p>Zesty citrus refreshment.</p>
          </div>
          <div className="flavor-card glassmorphism lemon">
            <div className="flavor-accent"></div>
            <h4>Lemon Lime</h4>
            <p>Crisp and perfectly balanced.</p>
          </div>
          <div className="flavor-card glassmorphism berry">
            <div className="flavor-accent"></div>
            <h4>Berry Fizz</h4>
            <p>Burst of wild mixed berries.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .rush-promo-container {
          position: relative;
          width: 100%;
          background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
          padding: 2rem 1.5rem;
          color: #fff;
          box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .promo-wrapper {
          position: relative;
          z-index: 10;
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .promo-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .promo-text-content {
          flex: 1;
          text-align: left;
        }

        .promo-graphic-content {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .promo-badge {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(90deg, #ec4899, #8b5cf6);
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.7rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
        }

        .promo-headline {
          font-size: 2.2rem;
          font-weight: 900;
          background: linear-gradient(to right, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.4rem;
          line-height: 1.1;
        }

        .promo-subheading {
          font-size: 0.95rem;
          color: #94a3b8;
          max-width: 500px;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        .launch-banner {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          padding: 0.4rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 1.5rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .compact-features {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .glassmorphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .compact-feature {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #e2e8f0;
          transition: background 0.2s ease;
        }
        
        .compact-feature:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .feature-icon {
          font-size: 1rem;
        }

        .main-graphic-container {
          position: relative;
          width: 140px;
          height: 200px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .glow-effect {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(0,0,0,0) 70%);
          filter: blur(25px);
          z-index: 1;
        }

        .soda-can {
          position: relative;
          z-index: 2;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          mix-blend-mode: lighten;
          filter: contrast(1.2) brightness(1.1);
        }

        .floating-animation {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .compact-flavors-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          width: 100%;
        }

        .flavor-card {
          position: relative;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          text-align: left;
          overflow: hidden;
          transition: transform 0.2s ease;
        }

        .flavor-card:hover {
          transform: translateY(-4px);
        }

        .flavor-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
        }

        .cola .flavor-accent { background: linear-gradient(90deg, #ef4444, #991b1b); }
        .orange .flavor-accent { background: linear-gradient(90deg, #f97316, #ea580c); }
        .lemon .flavor-accent { background: linear-gradient(90deg, #84cc16, #4d7c0f); }
        .berry .flavor-accent { background: linear-gradient(90deg, #a855f7, #6b21a8); }

        .flavor-card h4 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          margin-top: 0.2rem;
          color: #f8fafc;
        }

        .flavor-card p {
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.3;
          margin: 0;
        }

        /* Floating Bubbles */
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.02));
          box-shadow: inset 0 0 10px rgba(255,255,255,0.1);
          animation: floatUp 15s infinite ease-in-out;
          opacity: 0.4;
        }
        .bubble-1 { width: 60px; height: 60px; left: 10%; bottom: -80px; animation-duration: 12s; animation-delay: 0s; }
        .bubble-2 { width: 30px; height: 30px; left: 25%; bottom: -40px; animation-duration: 8s; animation-delay: 2s; }
        .bubble-3 { width: 90px; height: 90px; right: 15%; bottom: -100px; animation-duration: 18s; animation-delay: 1s; }
        .bubble-4 { width: 40px; height: 40px; right: 30%; bottom: -60px; animation-duration: 14s; animation-delay: 4s; }
        .bubble-5 { width: 25px; height: 25px; left: 50%; bottom: -30px; animation-duration: 10s; animation-delay: 3s; }

        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.4; }
          50% { transform: translateY(-300px) scale(1.1); }
          80% { opacity: 0.2; }
          100% { transform: translateY(-600px) scale(1); opacity: 0; }
        }

        /* Responsive Styles */
        @media (max-width: 860px) {
          .promo-main-row {
            flex-direction: column;
            text-align: center;
          }
          .promo-text-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .compact-features {
            justify-content: center;
          }
          .compact-flavors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .promo-headline {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .compact-flavors-grid {
            grid-template-columns: 1fr;
          }
          .promo-headline {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}
