'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { FaArrowLeft, FaExclamationCircle, FaCheck } from 'react-icons/fa';

// Food donation guidelines
const FOOD_GUIDELINES = [
  'Food is still safe for consumption',
  'Food has been properly stored at appropriate temperatures',
  'Food is packaged in clean, sealed containers',
  'Food details and ingredients are accurately described',
  'You can guarantee food quality and safety',
];

export default function AddFood() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo: '',
    guidelinesAccepted: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  
  // Redirect if not authenticated or not a restaurant
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'restaurant') {
        router.push('/ngo-dashboard');
      }
    }
  }, [status, session, router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData({
        ...formData,
        photo: result,
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Please enter a title for the food donation');
      }
      
      if (!formData.description.trim()) {
        throw new Error('Please enter a description for the food donation');
      }
      
      if (!formData.guidelinesAccepted) {
        throw new Error('You must accept the food donation guidelines');
      }
      
      // Create the food donation
      const response = await fetch('/api/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create food donation');
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        photo: '',
        guidelinesAccepted: false,
      });
      setImagePreview('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/restaurant-dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating food donation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Add New Food Donation</h1>
            </div>
            
            {/* Food safety guidelines */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-700">Food Donation Guidelines</h3>
                  <div className="mt-2 text-sm text-blue-600">
                    <ul className="list-disc pl-5 space-y-1">
                      {FOOD_GUIDELINES.map((guideline, index) => (
                        <li key={index}>{guideline}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {success ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Food donation added successfully! Redirecting you back to dashboard...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Food Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="E.g., Freshly made pasta, Leftover catering food"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe the food, quantity, when it was prepared, ingredients, allergens, etc."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                    Food Photo
                  </label>
                  
                  <div className="mt-1 flex items-center space-x-5">
                    <input
                      type="file"
                      id="photo"
                      name="photo"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                    >
                      Upload Image
                    </label>
                    
                    {imagePreview && (
                      <div className="relative h-20 w-20">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a clear image of the food. This helps NGOs identify the food you're donating.
                  </p>
                </div>
                
                {/* Guidelines acceptance checkbox */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="guidelinesAccepted"
                      name="guidelinesAccepted"
                      type="checkbox"
                      checked={formData.guidelinesAccepted}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="guidelinesAccepted" className="font-medium text-gray-700">
                      I confirm that this food donation meets all the guidelines above*
                    </label>
                    <p className="text-gray-500">
                      Your confirmation ensures food safety for recipients.
                    </p>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Add Donation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 