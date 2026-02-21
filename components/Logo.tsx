
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'colored';
  withSubtext?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'colored', withSubtext = true }) => {
  const containerSize = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  }[size];

  const textSize = {
    sm: 'text-xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  }[size];

  const ayooTextSize = {
    sm: 'text-2xl',
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${containerSize} relative flex items-center justify-center`}>
        {/* Abstract Colorful Shape */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #00C2FF 30%, #8A2BE2 60%, #FF00CC 100%)',
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            transform: 'rotate(-10deg)'
          }}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-[inherit]"></div>
          
          {/* Shine effect */}
          <div className="absolute top-2 left-4 w-1/3 h-1/3 bg-white/40 rounded-full blur-md"></div>
        </div>
        
        {/* 'ay' text */}
        <span className={`relative z-10 font-black text-white tracking-tighter drop-shadow-md ${textSize}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
          ay
        </span>

        {/* Floating bubbles/dots */}
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#FFD700] rounded-full border-2 border-white shadow-sm animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 -right-3 w-2 h-2 bg-[#FF00CC] rounded-full border border-white shadow-sm animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -bottom-1 left-1 w-2.5 h-2.5 bg-[#00C2FF] rounded-full border border-white shadow-sm animate-bounce" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <h1 className={`font-black mt-3 tracking-tighter leading-none ${variant === 'white' ? 'text-white' : 'text-[#FF00CC]'} ${ayooTextSize}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
        ayoo
      </h1>
      
      {withSubtext && (
        <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${variant === 'white' ? 'text-white/80' : 'text-[#FF00CC]/60'}`}>
          #1 Tatak Pinoy Food Delivery in the Philippines
        </p>
      )}
    </div>
  );
};

export default Logo;
