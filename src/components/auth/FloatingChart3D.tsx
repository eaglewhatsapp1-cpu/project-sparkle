import { useEffect, useState } from 'react';

function AnimatedBar({ delay, height, color }: { delay: number; height: string; color: string }) {
  return (
    <div 
      className="w-8 rounded-t-lg transition-all duration-1000 ease-in-out"
      style={{
        height,
        background: `linear-gradient(180deg, ${color} 0%, ${color}40 100%)`,
        boxShadow: `0 0 20px ${color}60`,
        animation: `barPulse 2s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function FloatingChart3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glowing orbs */}
      <div className="absolute w-32 h-32 rounded-full bg-[hsl(262,80%,60%)] blur-[80px] opacity-50 animate-pulse" style={{ top: '10%', left: '20%' }} />
      <div className="absolute w-24 h-24 rounded-full bg-[hsl(330,70%,55%)] blur-[60px] opacity-40 animate-pulse" style={{ top: '60%', right: '15%', animationDelay: '1s' }} />
      <div className="absolute w-20 h-20 rounded-full bg-[hsl(200,90%,55%)] blur-[50px] opacity-40 animate-pulse" style={{ bottom: '20%', left: '30%', animationDelay: '0.5s' }} />

      {/* Main 3D-like cube container */}
      <div 
        className={`relative transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Rotating rings */}
        <div 
          className="absolute inset-0 w-64 h-64 -left-8 -top-8 border-2 border-[hsl(262,80%,60%)]/30 rounded-full"
          style={{
            animation: 'spin 20s linear infinite',
          }}
        />
        <div 
          className="absolute inset-0 w-72 h-72 -left-12 -top-12 border border-[hsl(200,90%,55%)]/20 rounded-full"
          style={{
            animation: 'spin 30s linear infinite reverse',
          }}
        />

        {/* Glass cube */}
        <div 
          className="relative w-48 h-48 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)',
            border: '1px solid rgba(168,85,247,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 0 30px rgba(168,85,247,0.1)',
            animation: 'float 6s ease-in-out infinite',
            transform: 'rotateX(10deg) rotateY(-10deg)',
          }}
        >
          {/* Wireframe effect */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Analytics bars */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-3">
            <AnimatedBar delay={0} height="60px" color="hsl(200,90%,55%)" />
            <AnimatedBar delay={0.3} height="90px" color="hsl(262,80%,60%)" />
            <AnimatedBar delay={0.6} height="70px" color="hsl(330,70%,55%)" />
            <AnimatedBar delay={0.9} height="50px" color="hsl(200,90%,55%)" />
          </div>

          {/* Floating data points */}
          <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-[hsl(200,90%,55%)] animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute top-10 right-8 w-2 h-2 rounded-full bg-[hsl(330,70%,55%)] animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute top-16 left-10 w-2 h-2 rounded-full bg-[hsl(262,80%,60%)] animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>

        {/* Orbiting particles */}
        <div 
          className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(330,70%,55%)]"
          style={{
            top: '0',
            left: '50%',
            boxShadow: '0 0 15px hsl(262,80%,60%)',
            animation: 'orbit 8s linear infinite',
          }}
        />
        <div 
          className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(200,90%,55%)] to-[hsl(262,80%,60%)]"
          style={{
            bottom: '10%',
            right: '10%',
            boxShadow: '0 0 12px hsl(200,90%,55%)',
            animation: 'orbit 12s linear infinite reverse',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: rotateX(10deg) rotateY(-10deg) translateY(0); }
          50% { transform: rotateX(15deg) rotateY(-15deg) translateY(-15px); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes barPulse {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.7); opacity: 0.7; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
