'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { FaArrowLeft, FaExclamationCircle, FaCheck } from 'react-icons/fa';
import { json } from 'stream/consumers';

// Cleanup task guidelines
const FOOD_GUIDELINES = [
  'Photos must clearly show the cleanup area',
  'Provide accurate estimated effort and resources needed',
  'Ensure location coordinates or address are correct',
  'Include any special instructions for the cleanup team',
  'Verify that the task is still required',
];

export default function AddFood() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // const [formData, setFormData] = useState({
  //   title: '',
  //   description: '',
  //   photo: '',
  //   guidelinesAccepted: false,
  // });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo: '',
    guidelinesAccepted: false,
    location: '', // Add this
  });
  
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
        setFormData((prev) => ({ ...prev, location: coords }));
      },
      () => setError('Unable to retrieve your location')
    );
  };

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
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData({ ...formData, photo: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (!formData.title.trim()) throw new Error('Please enter a title for the cleanup task');
      if (!formData.description.trim()) throw new Error('Please describe the cleanup task');
      if (!formData.guidelinesAccepted) throw new Error('You must confirm the cleanup guidelines');
      
      // Detailed logging for debugging
      console.log("Form data being submitted:");
      console.log("Title:", formData.title);
      console.log("Description:", formData.description);
      console.log("Photo length:", formData.photo ? formData.photo.length : 0);
      console.log("Guidelines accepted:", formData.guidelinesAccepted);
      console.log("Location:", formData.location);
      console.log("Complete form data:", JSON.stringify(formData));
      
      const response = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit cleanup report');
      }
      
      // Submission successful - now award CleanCoins
      try {
        const rewardResponse = await fetch('/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'report_submission',
            amount: 50 // Award 50 CleanCoins for each task report
          })
        });
        
        if (rewardResponse.ok) {
          const rewardData = await rewardResponse.json();
          console.log('CleanCoins awarded:', rewardData);
          setSuccess(true);
          setFormData({ title: '', description: '', photo: '', guidelinesAccepted: false, location: '' });
          setImagePreview('');
          // Show success message with reward
          setSuccessMessage(`Task submitted successfully! You earned ${rewardData.amount} CleanCoins. Your new balance: ${rewardData.newBalance} CleanCoins.`);
          setTimeout(() => router.push('/restaurant-dashboard'), 3000);
        } else {
          console.error('Failed to award CleanCoins');
          // Still mark submission as successful even if reward fails
          setSuccess(true);
          setFormData({ title: '', description: '', photo: '', guidelinesAccepted: false, location: '' });
          setImagePreview('');
          setTimeout(() => router.push('/restaurant-dashboard'), 2000);
        }
      } catch (rewardError) {
        console.error('Error awarding CleanCoins:', rewardError);
        // Still mark submission as successful even if reward fails
        setSuccess(true);
        setFormData({ title: '', description: '', photo: '', guidelinesAccepted: false, location: '' });
        setImagePreview('');
        setTimeout(() => router.push('/restaurant-dashboard'), 2000);
      }
    } catch (err: any) {
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
              <h1 className="text-2xl font-bold text-gray-900">Report New Cleanup Task</h1>
            </div>

            {/* Guidelines Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-700">Cleanup Guidelines</h3>
                  <div className="mt-2 text-sm text-blue-600">
                    <ul className="list-disc pl-5 space-y-1">
                      {FOOD_GUIDELINES.map((guideline, idx) => (
                        <li key={idx}>{guideline}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage || "Cleanup report submitted successfully! Redirecting..."}
                    </p>
                    
                    {/* Show CleanCoins animation */}
                    {successMessage.includes('CleanCoins') && (
                      <div className="mt-3 flex items-center">
                        <div className="h-8 w-8 mr-2 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-xs font-bold text-yellow-800">+50</span>
                        </div>
                        <span className="text-sm text-green-700 font-semibold">CleanCoins awarded!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="E.g., Park litter cleanup, Beach debris collection"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Details: location, estimated volunteers, time required"
                  />
                </div>
                <div>
  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
    Location*
  </label>
  <div className="flex items-center space-x-4">
    <input
      type="text"
      id="location"
      name="location"
      value={formData.location}
      onChange={handleChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
      placeholder="Latitude, Longitude"
      readOnly // optional to prevent editing
    />
    <button
      type="button"
      onClick={handleGetLocation}
      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
    >
      Get Location
    </button>
  </div>
</div>

                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Photo
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
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer"
                    >
                      Upload Image
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Attach a clear photo of the cleanup site.
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="guidelinesAccepted"
                      name="guidelinesAccepted"
                      checked={formData.guidelinesAccepted}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="guidelinesAccepted" className="font-medium text-gray-700">
                      I confirm this task meets the cleanup guidelines*
                    </label>
                    <p className="text-gray-500">Your confirmation helps ensure task accuracy.</p>
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
                    className="px-4 py-2 bg-gray-100 rounded mr-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Report'}
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
