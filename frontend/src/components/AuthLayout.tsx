import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full bg-bg-light relative overflow-hidden flex items-center justify-center font-sans text-text-dark">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/3 -translate-y-1/3 animate-blob" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/3 translate-y-1/3 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <span 
              className="text-text-dark" 
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "32px", letterSpacing: "-2px" }}
            >
              GYAU
            </span>
          </div>
          <p className="text-text-light text-sm">Your AI-powered aesthetic planner.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-8 rounded-[32px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
          <p className="text-text-light text-center mb-8 text-sm">{subtitle}</p>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
