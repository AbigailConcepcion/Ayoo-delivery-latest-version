
import React, { useState } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      image: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png",
      title: "Welcome",
      description: "Hello mga ka AYOO ! Welcome to our new food delivery app in Iligan city.",
      isMascot: true
    },
    {
      image: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20Places/World%20Map.png",
      title: "New Exciting Features",
      description: "Easily find your type of food craving and you'll get delivery in wide range .",
      isMascot: false
    }
  ];

  return (
    <div className="bg-white h-screen flex flex-col items-center justify-between p-8 relative overflow-hidden">
      <div className="w-full flex justify-end">
        <button onClick={onFinish} className="text-[#FF00CC] font-bold text-lg hover:opacity-70 transition-opacity pr-2 pt-2">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="mb-12 transform scale-90">
          <Logo variant="colored" size="sm" withSubtext={false} />
        </div>
        
        <div className="flex flex-col items-center text-center w-full animate-in fade-in duration-700">
            {steps[step].isMascot ? (
              <div className="relative mb-10 w-56 h-56 flex items-center justify-center">
                <img 
                  src={steps[step].image} 
                  className="w-44 h-44 object-contain drop-shadow-2xl animate-bounce" 
                  alt="Ayoo Mascot" 
                  style={{ animationDuration: '4s' }}
                />
              </div>
            ) : (
              <div className="mb-10 w-56 h-56 flex items-center justify-center p-6 relative">
                <img src={steps[step].image} className="w-full h-full object-contain relative z-10 drop-shadow-xl" alt="Features" />
              </div>
            )}
            
            <h2 className="text-4xl font-black mb-4 text-gray-900 tracking-tight leading-tight">{steps[step].title}</h2>
            <p className="text-gray-500 text-lg leading-relaxed font-medium">
                {steps[step].description}
            </p>
        </div>

        <div className="flex gap-2 my-10">
            {[0, 1, 2].map((i) => (
                <div key={i} 
                  className={`h-4 rounded-full transition-all duration-300 ${i === step ? 'w-10 bg-[#FF00CC]' : 'w-4 bg-gray-200'}`} 
                />
            ))}
        </div>

        <Button 
          className="pill-shadow py-5 text-xl font-bold tracking-tight"
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onFinish()}
        >
            Get Started
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
