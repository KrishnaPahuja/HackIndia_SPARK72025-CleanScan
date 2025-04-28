'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { FaUtensils, FaHandHoldingHeart } from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    description: '',
    role: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Calculate password strength
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return { text: "Weak", color: "bg-red-500" };
    if (passwordStrength === 1) return { text: "Fair", color: "bg-orange-500" };
    if (passwordStrength === 2) return { text: "Good", color: "bg-yellow-500" };
    if (passwordStrength === 3) return { text: "Strong", color: "bg-green-500" };
    return { text: "Very Strong", color: "bg-green-600" };
  };

  const handleRoleSelection = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.email || !formData.password || !formData.address || !formData.description || !formData.role) {
      setError('All fields are required');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Redirect to login page
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Conditionally show role-specific fields
  const showDetailedForm = formData.role !== '';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Join our food waste reduction community</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {!showDetailedForm ? (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-6 text-center">I want to register as:</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('restaurant')}
                    className="group relative bg-white border-2 border-gray-200 hover:border-green-500 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center h-48"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
                      <FaUtensils className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Restaurant</h3>
                    <p className="text-gray-600 text-center text-sm">I want to donate excess food</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('ngo')}
                    className="group relative bg-white border-2 border-gray-200 hover:border-green-500 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center h-48"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
                      <FaHandHoldingHeart className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">NGO / Food Bank</h3>
                    <p className="text-gray-600 text-center text-sm">I want to collect & distribute food</p>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mb-1">
                  <div className="flex items-center mb-2">
                    <div className={`w-7 h-7 flex-shrink-0 rounded-full ${formData.role === 'restaurant' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mr-2`}>
                      {formData.role === 'restaurant' ? <FaUtensils className="h-3 w-3" /> : <FaHandHoldingHeart className="h-3 w-3" />}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      You're registering as: <span className="font-bold">{formData.role === 'restaurant' ? 'Restaurant' : 'NGO / Food Bank'}</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    {formData.role === 'restaurant' ? 'Restaurant Name' : 'Organization Name'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                    minLength={6}
                  />
                  
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`${getStrengthLabel().color} h-full`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-600">{getStrengthLabel().text}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password should be at least 6 characters with uppercase letters, numbers and symbols.
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    {formData.role === 'restaurant' 
                      ? 'Restaurant Description' 
                      : 'Organization Description'}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                    placeholder={formData.role === 'restaurant' 
                      ? 'Tell us about your restaurant, cuisine type, etc.' 
                      : 'Tell us about your organization and mission'}
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: '' }))}
                    className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-green-600 font-medium hover:text-green-800 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          
          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>By creating an account, you agree to our <a href="#" className="text-gray-700 hover:text-green-600">Terms of Service</a> and <a href="#" className="text-gray-700 hover:text-green-600">Privacy Policy</a>.</p>
          </div>
        </div>
      </div>
    </>
  );
} 