'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FoodCard from '@/components/FoodCard';
import { FaSearch, FaPlus, FaFilter, FaExclamationCircle, FaCalendarAlt, FaTag } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';
import RatingsSection from '@/components/RatingsSection';

// Extend the user type to include role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Define the food item type to avoid 'never' type errors
interface FoodItem {
  _id: string;
  title: string;
  description: string;
  photo: string;
  status: 'available' | 'claimed' | 'completed' | 'expired';
  createdAt: string;
  donorId: {
    _id: string;
    name: string;
    address: string;
    rating: number;
    ratingCount: number;
  };
  isExpired?: boolean;
  claimedBy?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  ngoDetails?: {
    name: string;
    phone?: string;
    pickupTime?: string | Date;
    notes?: string;
    email?: string;
    address?: string;
  };
}

// Define the restaurant type to avoid 'never' type errors
interface Restaurant {
  _id: string;
  name: string;
  address: string;
  description: string;
  rating: number;
  ratingCount: number;
}

// Define the rating type to avoid 'never' type errors
interface Rating {
  _id: string;
  raterId: string | { name?: string; _id: string }; // Can be either string ID or populated object
  ratedId: string;
  rating: number;
  comment: string;
  createdAt: string;
  raterName?: string;
}

// Food donation guidelines
const FOOD_GUIDELINES = [
  'Food is still safe for consumption',
  'Food has been properly stored at appropriate temperatures',
  'Food is packaged in clean, sealed containers',
  'Food details and ingredients are accurately described',
  'You can guarantee food quality and safety',
];

export default function RestaurantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('all');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Fetch restaurant donations
  useEffect(() => {
    // Redirect if not authenticated or not a restaurant
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && (session?.user as ExtendedUser)?.role !== 'restaurant') {
      router.push('/ngo-dashboard');
      return;
    }
    
    const fetchDonations = async () => {
      try {
        setLoading(true);
        setError('');
        
        const userId = (session?.user as ExtendedUser)?.id;
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        // Fetch food donations based on active tab
        let url = `/api/food?userId=${userId}&userRole=restaurant`;
        if (activeTab !== 'all') {
          url += `&status=${activeTab}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch food donations');
        }
        
        const data = await response.json();
        setFoods(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchDonations();
    }
  }, [activeTab, status, session, router]);
  
  // Handle donation status change
  const handleStatusChange = () => {
    // Refresh donations
    fetchDonations();
  };
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      const userId = (session?.user as ExtendedUser)?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Fetch food donations based on active tab
      let url = `/api/food?userId=${userId}&userRole=restaurant`;
      if (activeTab !== 'all') {
        url += `&status=${activeTab}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch food donations');
      }
      
      const data = await response.json();
      setFoods(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter foods based on search term and status
  const filteredFoods = foods.filter(food => {
    const matchesSearch = searchTerm === '' || 
      food.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      food.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === '' || food.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });
  
  // Open add food modal
  const openAddFoodModal = () => {
    router.push('/add-food');
  };
  
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your food donations and track their status</p>
            </div>
            
            <button
              onClick={openAddFoodModal}
              className="btn-primary flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              Add New Donation
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <FaTag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">{foods.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaCalendarAlt className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foods.filter(food => food.status === 'available').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Claimed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foods.filter(food => food.status === 'claimed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foods.filter(food => food.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center sm:justify-between flex-wrap sm:flex-nowrap px-4 border-b border-gray-200">
              <nav className="flex overflow-x-auto hide-scrollbar py-3 space-x-5 sm:space-x-8">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'all'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Donations
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'available'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setActiveTab('claimed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'claimed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Claimed
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab('expired')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'expired'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Expired
                </button>
                <button
                  onClick={() => setActiveTab('ratings')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'ratings'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Ratings
                </button>
              </nav>
              
              <div className="w-full sm:w-auto mt-3 sm:mt-0 flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search donations..."
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
            
            {/* Status filter (only show when all donations tab is active) */}
            {showFilters && activeTab === 'all' && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setStatusFilter('')}
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === '' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('available')}
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setStatusFilter('claimed')}
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'claimed' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Claimed
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setStatusFilter('expired')}
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === 'expired' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Expired
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
          
          {/* Donation list */}
          <div>
            {loading ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <LoadingSpinner size="md" color="text-green-500" />
                <p className="mt-4 text-gray-600">Loading your donations...</p>
              </div>
            ) : activeTab === 'ratings' ? (
              <RatingsSection userId={(session?.user as ExtendedUser)?.id || ''} />
            ) : filteredFoods.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No donations found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? "You haven't made any food donations yet. Start by adding a new donation!" 
                    : `You don't have any ${activeTab} food donations.`}
                </p>
                <button
                  onClick={openAddFoodModal}
                  className="btn-primary flex items-center justify-center mx-auto"
                >
                  <FaPlus className="mr-2" />
                  Add New Donation
                </button>
              </div>
            ) : (
              <>
                {filteredFoods.length > 0 && (
                  <div className="mb-6 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                    Showing {filteredFoods.length} donation{filteredFoods.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter && ` with status "${statusFilter}"`}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFoods.map((food) => (
                    <div key={food._id} className="transition-all duration-300 hover:translate-y-[-4px]">
                      <FoodCard 
                        food={food} 
                        onStatusChange={handleStatusChange} 
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 