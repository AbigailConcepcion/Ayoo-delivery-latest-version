
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';
import Button from '../components/Button';

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      image: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog.png",
      title: "Welcome",
      description: "Hello mga ka AYOO ! Welcome to our new food delivery app in Iligan city.",
      isMascot: true
    },
    {
      image: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
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
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 0.75, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Logo variant="colored" size="sm" withSubtext={false} />
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full"
          >
            {steps[step].isMascot ? (
              <div className="relative mb-8 w-64 h-64 flex items-center justify-center">
                <motion.img 
                  src={steps[step].image} 
                  className="w-56 h-56 object-contain drop-shadow-2xl" 
                  alt="Ayoo Mascot" 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                />
              </div>
            ) : (
              <div className="mb-8 w-64 h-64 flex items-center justify-center p-4 relative">
                <img src={steps[step].image} className="w-full h-full object-contain relative z-10 drop-shadow-xl opacity-80" alt="Features" />
                {/* Simulated Map Pins */}
                <motion.div 
                  className="absolute top-1/3 left-1/3 w-4 h-4 bg-[#FF00CC] rounded-full border-2 border-white shadow-md"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                />
                <motion.div 
                  className="absolute top-1/2 right-1/3 w-4 h-4 bg-[#FF00CC] rounded-full border-2 border-white shadow-md"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                />
                <motion.div 
                  className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-[#FF00CC] rounded-full border-2 border-white shadow-md"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.8 }}
                />
              </div>
            )}
            
            <h2 className="text-3xl font-black mb-4 text-gray-900 tracking-tight leading-tight">{steps[step].title}</h2>
            <p className="text-gray-500 text-base leading-relaxed font-medium px-4">
                {steps[step].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 my-8">
            {[0, 1, 2].map((i) => (
                <motion.div 
                  key={i} 
                  className={`h-3 rounded-full ${i === step ? 'bg-[#FF00CC]' : 'bg-gray-300'}`}
                  animate={{ width: i === step ? 32 : 12 }}
                  transition={{ duration: 0.3 }}
                />
            ))}
        </div>

        <Button 
          className="pill-shadow py-4 text-lg font-bold tracking-tight w-full max-w-xs"
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onFinish()}
        >
            Get Started
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
