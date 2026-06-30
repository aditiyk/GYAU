import React from 'react';

interface AnimatedButtonProps extends React.HTMLAttributes<any> {
  children: React.ReactNode;
  as?: 'button' | 'label';
}

export default function AnimatedButton({ children, className = '', as: Component = 'button', ...props }: AnimatedButtonProps) {
  return (
    <Component 
      className={`relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-full font-semibold group active:scale-[0.98] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)] cursor-pointer ${className}`}
      {...props as any}
    >
      <span 
        className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_90deg_at_50%_50%,#fbcfe8_0%,#e9d5ff_25%,#a5f3fc_50%,#a7f3d0_75%,#fbcfe8_100%)] animate-spin" 
        style={{ animationDuration: '4s' }} 
      />
      <span className="relative flex items-center justify-center gap-2 px-5 py-2 text-sm bg-white/95 backdrop-blur-sm rounded-full text-gray-700 w-full h-full transition-colors group-hover:bg-white">
        {children}
      </span>
    </Component>
  );
}
