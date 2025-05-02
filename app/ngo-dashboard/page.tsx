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
  photo: string;
  createdAt: string;
  status: "available" | "claimed" | "completed" | "expired";
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
  
  // Added: state to drive the details popup
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sector, setSector] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [volunteers, setVolunteers] = useState('');
  const [wasteTypes, setWasteTypes] = useState('');
  const [operationRegion, setOperationRegion] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);

  // State to track if org details exist
  const [hasOrgDetails, setHasOrgDetails] = useState(false);

  const openDetailsModal = async () => {
    setDetailsError('');
    setDetailsLoading(true);
    
    try {
      // Fetch existing NGO details
      const response = await fetch('/api/ngoDetails');
      
      if (response.ok) {
        const data = await response.json();
        // Set the form fields with existing data, or empty strings if no data exists
        setSector(data.ngoDetails?.sector || '');
        setCertNumber(data.ngoDetails?.certNumber || '');
        setVolunteers(data.ngoDetails?.volunteers || '');
        setWasteTypes(data.ngoDetails?.wasteTypes || '');
        setOperationRegion(data.ngoDetails?.operationRegion || '');
        console.log('Loaded existing NGO details');
      } else {
        // If there's an error fetching data, use empty fields
        setSector('');
        setCertNumber('');
        setVolunteers('');
        setWasteTypes('');
        setOperationRegion('');
        console.error('Failed to fetch organization details');
      }
    } catch (error) {
      console.error('Error loading organization details:', error);
      // Reset form fields on error
      setSector('');
      setCertNumber('');
      setVolunteers('');
      setWasteTypes('');
      setOperationRegion('');
    } finally {
      setDetailsLoading(false);
      setShowDetailsModal(true);
    }
  };

  // Fetch organization details on component mount
  useEffect(() => {
    const checkOrgDetails = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/ngoDetails');
          if (response.ok) {
            const data = await response.json();
            // Check if any required fields exist
            if (data.ngoDetails?.sector && data.ngoDetails?.certNumber) {
              setHasOrgDetails(true);
            }
          }
        } catch (error) {
          console.error('Error checking organization details:', error);
        }
      }
    };
    
    checkOrgDetails();
  }, [status]);
  
  // Save details function with updated hasOrgDetails
  const saveDetails = async () => {
    setDetailsLoading(true);
    setDetailsError('');
    try {
      if (!sector.trim() || !certNumber.trim()) {
        throw new Error('Please fill all required fields');
      }
      const ngoDetails = {
        sector,
        certNumber,
        volunteers,
        wasteTypes,
        operationRegion,
        userId: (session?.user as ExtendedUser)?.id
      };
      
      console.log("Saving NGO details:", ngoDetails);
      
      const res = await fetch('/api/ngoDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ngoDetails),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save details');
      }
      
      // Set the hasOrgDetails flag to true after successful save
      setHasOrgDetails(true);
      setShowDetailsModal(false);

      // now re-fetch your tasks so they're filtered by the new NGO details
      fetchData();
    } catch (e: any) {
      setDetailsError(e.message);
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Fetch data based on active tab
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
              <p className="text-gray-600 mt-1">Find and manage tasks for your organization</p>
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
                  Available Task
                </button>
                <button
                  onClick={() => setActiveTab('claimed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'claimed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Ongoing Task
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Completed Tasks
                </button>
                <button
                  onClick={openDetailsModal}
                  className={`whitespace-nowrap py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    showDetailsModal
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Organization Details
                  {hasOrgDetails && (
                    <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-green-500" title="Details saved"></span>
                  )}
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
                    Browse Available Task
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredFoods.length > 0 && (
                  <div className="mb-6 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                    Showing {filteredFoods.length} {activeTab} current task 
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
                              Mark as Completed
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
      
      {/* Organization Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Organization Details</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide details about your organization to help us match you with appropriate cleanup tasks.
            </p>
            
            {detailsLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                <p className="mt-2 text-gray-600">Loading your details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Sector of Specialization*</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Environmental, Community cleanup"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Main focus area of your organization</p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Certification Number*</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={e => setCertNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., NGO12345"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Your organization's official registration number</p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Number of Volunteers</label>
                  <input
                    type="number"
                    value={volunteers}
                    onChange={e => setVolunteers(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 25"
                  />
                  <p className="mt-1 text-xs text-gray-500">How many volunteers can your organization mobilize</p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Types of Waste Handled</label>
                  <input
                    type="text"
                    value={wasteTypes}
                    onChange={e => setWasteTypes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Plastic, Electronic, General litter"
                  />
                  <p className="mt-1 text-xs text-gray-500">What types of waste does your organization specialize in collecting</p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Operation Region</label>
                  <input
                    type="text"
                    value={operationRegion}
                    onChange={e => setOperationRegion(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Central city, North suburb, Riverside area"
                  />
                  <p className="mt-1 text-xs text-gray-500">Geographical areas where your organization operates</p>
                </div>
              </div>
            )}
            
            {detailsError && (
              <div className="mt-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r">
                <p className="font-medium">{detailsError}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                disabled={detailsLoading}
              >
                Cancel
              </button>
              <button
                onClick={saveDetails}
                disabled={detailsLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {detailsLoading ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 