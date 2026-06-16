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

      <div className="promo-content">
        <div className="promo-badge">
          🚀 COMING SOON
        </div>
        
        <h2 className="promo-headline">RUSH Soda is Coming Soon!</h2>
        <p className="promo-subheading">
          Get ready for a refreshing new experience. Exciting flavors and sparkling refreshment are on the way.
        </p>

        <div className="main-graphic-container">
          <div className="glow-effect"></div>
          <img 
            src="/rush-soda-can-new.png" 
            alt="RUSH Soda Premium Can" 
            className="soda-can floating-animation"
          />
        </div>

        <div className="launch-banner">
          <span className="pulse-dot"></span>
          Launching Soon Across Pune
        </div>

        <div className="features-grid">
          <div className="feature-item glassmorphism">
            <div className="feature-icon">💧</div>
            <span>Refreshing Taste</span>
          </div>
          <div className="feature-item glassmorphism">
            <div className="feature-icon">✨</div>
            <span>Premium Quality</span>
          </div>
          <div className="feature-item glassmorphism">
            <div className="feature-icon">🌈</div>
            <span>Multiple Flavors</span>
          </div>
          <div className="feature-item glassmorphism">
            <div className="feature-icon">🚀</div>
            <span>Launching Soon</span>
          </div>
        </div>

        <h3 className="flavors-heading">Upcoming Flavors</h3>
        <div className="flavors-grid">
          <div className="flavor-card glassmorphism cola">
            <div className="flavor-accent"></div>
            <h4>Cola Blast</h4>
            <p>Classic cola taste with an electrifying twist.</p>
          </div>
          <div className="flavor-card glassmorphism orange">
            <div className="flavor-accent"></div>
            <h4>Orange Spark</h4>
            <p>Zesty and vibrant citrus refreshment.</p>
          </div>
          <div className="flavor-card glassmorphism lemon">
            <div className="flavor-accent"></div>
            <h4>Lemon Lime Rush</h4>
            <p>Crisp, clear, and perfectly balanced.</p>
          </div>
          <div className="flavor-card glassmorphism berry">
            <div className="flavor-accent"></div>
            <h4>Berry Fizz</h4>
            <p>A burst of wild mixed berries.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .rush-promo-container {
          position: relative;
          width: 100%;
          min-height: 80vh;
          background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
          border-radius: var(--radius-2xl, 24px);
          overflow: hidden;
          padding: 4rem 2rem;
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Floating Bubbles */
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.05));
          box-shadow: inset 0 0 20px rgba(255,255,255,0.2), 0 0 10px rgba(255,255,255,0.1);
          animation: floatUp 15s infinite ease-in-out;
          opacity: 0.6;
        }
        .bubble-1 { width: 80px; height: 80px; left: 10%; bottom: -100px; animation-duration: 12s; animation-delay: 0s; }
        .bubble-2 { width: 40px; height: 40px; left: 25%; bottom: -50px; animation-duration: 8s; animation-delay: 2s; }
        .bubble-3 { width: 120px; height: 120px; right: 15%; bottom: -150px; animation-duration: 18s; animation-delay: 1s; }
        .bubble-4 { width: 60px; height: 60px; right: 30%; bottom: -80px; animation-duration: 14s; animation-delay: 4s; }
        .bubble-5 { width: 30px; height: 30px; left: 50%; bottom: -40px; animation-duration: 10s; animation-delay: 3s; }

        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          50% { transform: translateY(-400px) scale(1.1); }
          80% { opacity: 0.4; }
          100% { transform: translateY(-800px) scale(1); opacity: 0; }
        }

        .promo-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .promo-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(90deg, #ec4899, #8b5cf6);
          padding: 0.5rem 1.2rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
        }

        .promo-headline {
          font-size: 3.5rem;
          font-weight: 900;
          background: linear-gradient(to right, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .promo-subheading {
          font-size: 1.2rem;
          color: #94a3b8;
          max-width: 600px;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .main-graphic-container {
          position: relative;
          margin-bottom: 3rem;
          width: 300px;
          height: 400px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .glow-effect {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(0,0,0,0) 70%);
          filter: blur(40px);
          z-index: 1;
        }

        .soda-can {
          position: relative;
          z-index: 2;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          mix-blend-mode: screen;
          filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)) contrast(1.15) brightness(1.1);
        }

        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .launch-banner {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 0.75rem 2rem;
          border-radius: 999px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 4rem;
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          width: 100%;
          margin-bottom: 4rem;
        }

        .glassmorphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 1rem;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        
        .feature-item:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
        }

        .feature-icon {
          font-size: 2.5rem;
          background: rgba(255, 255, 255, 0.1);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .feature-item span {
          font-weight: 600;
          font-size: 1rem;
          color: #e2e8f0;
        }

        .flavors-heading {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 2rem;
          text-align: center;
          color: #fff;
        }

        .flavors-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          width: 100%;
        }

        .flavor-card {
          position: relative;
          padding: 2rem 1.5rem;
          border-radius: 1rem;
          text-align: left;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .flavor-card:hover {
          transform: translateY(-10px);
        }

        .flavor-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
        }

        .cola .flavor-accent { background: linear-gradient(90deg, #ef4444, #991b1b); }
        .orange .flavor-accent { background: linear-gradient(90deg, #f97316, #ea580c); }
        .lemon .flavor-accent { background: linear-gradient(90deg, #84cc16, #4d7c0f); }
        .berry .flavor-accent { background: linear-gradient(90deg, #a855f7, #6b21a8); }

        .flavor-card h4 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
          color: #f8fafc;
        }

        .flavor-card p {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        /* Responsive Styles */
        @media (max-width: 1024px) {
          .features-grid, .flavors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .promo-headline {
            font-size: 3rem;
          }
        }

        @media (max-width: 640px) {
          .features-grid, .flavors-grid {
            grid-template-columns: 1fr;
          }
          .promo-headline {
            font-size: 2.2rem;
          }
          .rush-promo-container {
            padding: 3rem 1.5rem;
          }
          .main-graphic-container {
            width: 250px;
            height: 350px;
          }
        }
      `}</style>
    </div>
  );
}
