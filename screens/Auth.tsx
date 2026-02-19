
import React, { useState } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { login: setAuthData } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [restaurantName, setRestaurantName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, name, role, restaurantName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (!isLogin) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setAuthData(data.user, data.token);
          onLogin();
        }, 2000);
      } else {
        setAuthData(data.user, data.token);
        onLogin();
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginView = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setShowRegPassword(false);
    setShowError(false);
    setShowSuccess(false);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out ${isLogin ? 'bg-[#FF00CC]' : 'bg-white'}`}>
      
      {/* Registration View */}
      {!isLogin && (
        <div className="flex-1 flex flex-col p-8 pt-12 animate-in slide-in-from-right-full duration-500 overflow-y-auto">
          <div className="mb-8 flex justify-center">
            <Logo variant="colored" size="sm" withSubtext={false} />
          </div>
          
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Create an account</h2>
            <p className="text-gray-400 font-bold mb-8 text-center text-sm">Join the Ayoo family today.</p>
            
            <form className="space-y-6" onSubmit={handleAuth}>
              <div className="input-label-border">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-semibold"
                  required
                />
              </div>

              <div className="input-label-border">
                <label>Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-semibold"
                  required
                />
              </div>

              <div className="input-label-border">
                <label>Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-semibold bg-white"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant / Restaurant Owner</option>
                  <option value="RIDER">Rider / Delivery Partner</option>
                </select>
              </div>

              {role === 'MERCHANT' && (
                <div className="input-label-border">
                  <label>Restaurant Name</label>
                  <input 
                    type="text" 
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Your restaurant name"
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-semibold"
                    required
                  />
                </div>
              )}

              <div className="input-label-border">
                <label>Password</label>
                <div className="relative">
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-semibold"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
                  >
                    {showRegPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="pill-shadow py-5 text-xl font-black">
                  {isLoading ? 'Processing...' : 'Sign Up'}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center pb-8">
                <p className="text-gray-400 font-bold text-sm">
                    Already have an account? 
                    <button 
                      onClick={toggleLoginView} 
                      className="ml-2 text-[#FF00CC] font-black hover:underline"
                    >
                        Sign In here
                    </button>
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Login View */}
      {isLogin && (
        <>
          <div className="flex-[0.4] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <Logo variant="white" size="lg" withSubtext={false} />
          </div>

          <div className="flex-[0.6] bg-white rounded-t-[50px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] floating-card flex flex-col">
            <div className="w-full max-w-sm mx-auto flex flex-col h-full">
              <h2 className="text-4xl font-black text-gray-900 mb-2 mt-2 text-center tracking-tighter">Welcome Back</h2>
              <p className="text-gray-400 text-center mb-10 font-bold leading-relaxed px-6 text-sm">
                Fill out the information below in order to access your account.
              </p>

              <form className="space-y-8" onSubmit={handleAuth}>
                <div className="input-label-border">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-bold"
                    required
                  />
                </div>

                <div className="input-label-border">
                  <label>Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-bold"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors ${showPassword ? 'text-[#FF00CC]' : 'text-gray-400'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.301 7.633 7.48 4.5 12 4.5s8.699 3.133 9.964 7.178c.07.225.07.457 0 .682C20.699 16.367 16.5 19.5 12 19.5s-8.699-3.133-9.964-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isLoading} className="pill-shadow py-5 text-xl font-black">
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center pb-8">
                  <p className="text-gray-400 font-bold text-sm">
                      Don't have an account? 
                      <button 
                        onClick={toggleLoginView} 
                        className="ml-2 text-[#FF00CC] font-black hover:underline"
                      >
                          Sign Up here
                      </button>
                  </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white rounded-full flex items-center overflow-hidden shadow-[0_25px_60px_-15px_rgba(34,197,94,0.3)] p-1 relative border border-green-50">
            <div className="absolute left-0 top-0 bottom-0 w-14 bg-green-500 rounded-l-full flex items-center justify-center text-white">✓</div>
            <div className="absolute right-0 top-0 bottom-0 w-14 bg-green-500 rounded-r-full"></div>
            
            <div className="flex-1 py-5 px-12 text-center leading-tight">
              <p className="text-[13px] font-black text-gray-800 tracking-tight uppercase">Account Created!</p>
              <p className="text-[12px] text-green-600 font-bold italic truncate px-2">Welcome to the Ayoo family.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white rounded-full flex items-center overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-1 relative border border-gray-100">
            <div className="absolute left-0 top-0 bottom-0 w-14 bg-[#FF00CC] rounded-l-full flex items-center justify-center text-white">!</div>
            <div className="absolute right-0 top-0 bottom-0 w-14 bg-[#FF00CC] rounded-r-full"></div>
            
            <div className="flex-1 py-5 px-12 text-center leading-tight">
              <p className="text-[13px] font-black text-gray-800 tracking-tight">Authentication Error</p>
              <p className="text-[12px] text-red-500 font-bold italic truncate px-2">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
