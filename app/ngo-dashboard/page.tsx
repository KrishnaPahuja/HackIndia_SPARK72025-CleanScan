'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FoodCard from '@/components/FoodCard';
import RateRestaurant from '@/components/RateRestaurant';
import { FaSearch, FaCheckCircle, FaMapMarkerAlt, FaFilter, FaExclamationCircle } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

// Extend user type to include role and id
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface FoodItem {
  _id: string;
  title: string;
  description: string;
  status: string;
  donorId: {
    _id: string;
    name: string;
    address: string;
    rating: number;
    ratingCount: number;
  };
  [key: string]: any; // Allow other properties
}

export default function NGODashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('available');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [myRequests, setMyRequests] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  
  // Fetch data based on active tab
  useEffect(() => {
    // Redirect if not authenticated or not an NGO
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && (session?.user as ExtendedUser)?.role !== 'ngo') {
      router.push('/restaurant-dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (activeTab === 'available') {
          const response = await fetch('/api/food?status=available');
          if (!response.ok) {
            throw new Error('Failed to fetch available food');
          }
          const data = await response.json();
          setFoods(data);
        } else if (activeTab === 'claimed' || activeTab === 'completed') {
          const userId = (session?.user as ExtendedUser)?.id;
          if (!userId) {
            throw new Error('User ID not found');
          }
          
          const response = await fetch(`/api/food?status=${activeTab}&userId=${userId}&userRole=ngo`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${activeTab} food requests`);
          }
          const data = await response.json();
          setMyRequests(data);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchData();
    }
  }, [activeTab, status, session, router]);
  
  // Handle status update (claim food or mark as completed)
  const handleStatusUpdate = async (foodId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/food/${foodId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to update food status to ${newStatus}`);
      }
      
      // Refresh data based on current tab
      if (activeTab === 'available') {
        const response = await fetch('/api/food?status=available');
        const data = await response.json();
        setFoods(data);
      } else {
        const userId = (session?.user as ExtendedUser)?.id;
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        const response = await fetch(`/api/food?status=${activeTab}&userId=${userId}&userRole=ngo`);
        const data = await response.json();
        setMyRequests(data);
      }
      
      // If marked as completed, switch to completed tab
      if (newStatus === 'completed') {
        setActiveTab('completed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle food request status change
  const handleFoodUpdate = () => {
    // Refresh current tab data
    if (activeTab === 'available') {
      fetchAvailableFoods();
    } else {
      fetchMyRequests(activeTab);
    }
  };
  
  const fetchAvailableFoods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food?status=available');
      if (!response.ok) {
        throw new Error('Failed to fetch available food');
      }
      const data = await response.json();
      setFoods(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMyRequests = async (status: string) => {
    try {
      setLoading(true);
      const userId = (session?.user as ExtendedUser)?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      console.log(`Fetching ${status} requests for NGO: ${userId}`);
      
      const response = await fetch(`/api/food?status=${status}&userId=${userId}&userRole=ngo`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${status} food requests`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} ${status} items:`, data);
      
      setMyRequests(data);
    } catch (err: any) {
      console.error(`Error fetching ${status} requests:`, err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter foods based on search term and location
  const filteredFoods = (activeTab === 'available' ? foods : myRequests).filter(food => {
    const matchesSearch = searchTerm === '' || 
      food.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      food.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesLocation = filterLocation === '' || 
      (food.donorId?.address && food.donorId.address.toLowerCase().includes(filterLocation.toLowerCase()));
      
    return matchesSearch && matchesLocation;
  });
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" color="text-green-500" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
              <p className="text-gray-600 mt-1">Find and manage food donations for your organization</p>
            </div>
            <div className="hidden md:block p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-green-800 font-medium">Logged in as:</span> <span className="text-green-700">{session?.user?.name || 'User'}</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center sm:justify-between flex-wrap sm:flex-nowrap px-4 border-b border-gray-200">
              <nav className="flex overflow-x-auto hide-scrollbar py-3 space-x-5 sm:space-x-8">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'available'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Available Food
                </button>
                <button
                  onClick={() => setActiveTab('claimed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'claimed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Claimed Food
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Completed Pickups
                </button>
              </nav>
              
              <div className="w-full sm:w-auto mt-3 sm:mt-0 flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={`Search ${activeTab} food...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${showFilters ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  <FaFilter className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Filters panel */}
            {showFilters && (
              <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-4 sm:space-y-0 sm:flex sm:space-x-6 items-center text-sm">
                <div className="sm:w-64">
                  <label className="block mb-1 font-medium text-gray-700">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by location..."
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="sm:flex-1">
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterLocation('');
                    }}
                    className="mt-5 sm:mt-6 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start">
              <FaExclamationCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Tab content */}
          <div>
            {loading ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <LoadingSpinner size="md" color="text-green-500" />
                <p className="mt-4 text-gray-600">Loading {activeTab} food...</p>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No food items found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {activeTab === 'available' 
                    ? "There are no available food donations at the moment. Check back later for new donations." 
                    : `You don't have any ${activeTab} food items.`}
                </p>
                {activeTab !== 'available' && (
                  <button
                    onClick={() => setActiveTab('available')}
                    className="btn-primary"
                  >
                    Browse Available Food
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredFoods.length > 0 && (
                  <div className="mb-6 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                    Showing {filteredFoods.length} {activeTab} food items
                    {searchTerm && ` matching "${searchTerm}"`}
                    {filterLocation && ` in "${filterLocation}"`}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTab === 'available' ? (
                    // Available Food Items
                    filteredFoods.map((food) => (
                      <div key={food._id} className="transition-all duration-300 hover:translate-y-[-4px]">
                        <FoodCard 
                          food={food} 
                          onStatusChange={handleFoodUpdate} 
                        />
                      </div>
                    ))
                  ) : (
                    // Claimed or Completed Food Items
                    filteredFoods.map((food) => (
                      <div key={food._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300">
                        <FoodCard food={food} onStatusChange={handleFoodUpdate} />
                        
                        {activeTab === 'claimed' && (
                          <div className="p-4 pt-0 border-t border-gray-100 mt-4">
                            <button
                              onClick={() => handleStatusUpdate(food._id, 'completed')}
                              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                            >
                              <FaCheckCircle className="mr-2 h-4 w-4" />
                              Mark as Received
                            </button>
                          </div>
                        )}
                        
                        {activeTab === 'completed' && (
                          <div className="p-4 pt-0 border-t border-gray-100 mt-4">
                            <RateRestaurant
                              foodId={food._id}
                              restaurantId={food.donorId._id}
                              onRatingSuccess={handleFoodUpdate}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 