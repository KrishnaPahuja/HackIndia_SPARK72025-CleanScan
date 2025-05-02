'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FoodCard from '@/components/FoodCard';
import { FaSearch, FaPlus, FaFilter, FaExclamationCircle, FaCalendarAlt, FaTag } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

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

export default function RestaurantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'claimed' | 'completed' | 'expired'>('all');
  const [tasks, setTasks] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && (session?.user as ExtendedUser)?.role !== 'restaurant') {
      router.push('/ngo-dashboard');
      return;
    }
    fetchTasks();
  }, [activeTab, status, session, router]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const userId = (session?.user as ExtendedUser)?.id;
      if (!userId) throw new Error('User ID not found');
      let url = `/api/food?userId=${userId}&userRole=restaurant`;
      if (activeTab !== 'all') url += `&status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddTask = () => router.push('/add-food');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" color="text-green-500" />
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CleanScan Dashboard</h1>
              <p className="text-gray-600">Manage cleanup reports</p>
            </div>
            <button onClick={openAddTask} className="btn-primary flex items-center">
              <FaPlus className="mr-2" /> Report New Task
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Reports', count: tasks.length, icon: <FaTag />, bg: 'bg-green-100 text-green-600' },
              { label: 'Pending', count: tasks.filter(t => t.status==='available').length, icon: <FaCalendarAlt />, bg: 'bg-blue-100 text-blue-600' },
              { label: 'In Progress', count: tasks.filter(t => t.status==='claimed').length, icon: <FaTag />, bg: 'bg-yellow-100 text-yellow-600' },
              { label: 'Completed', count: tasks.filter(t => t.status==='completed').length, icon: <FaCalendarAlt />, bg: 'bg-purple-100 text-purple-600' },
            ].map(({label,count,icon,bg}) => (
              <div key={label} className="bg-white rounded-xl shadow p-6 border">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs & Filters */}
          <div className="bg-white rounded-xl shadow mb-8 border">
            <div className="px-4 border-b flex flex-wrap items-center justify-between">
              <nav className="flex space-x-4 overflow-x-auto">
                {['all','available','claimed','completed','expired'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-2 px-3 border-b-2 ${activeTab===tab?'border-green-600 text-green-600':'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >{ tab==='all'? 'All Reports': tab==='available'?'Pending':tab==='claimed'?'In Progress':tab==='completed'?'Completed':'Expired' }</button>
                ))}
              </nav>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-2 text-gray-400" />
                  <input
                    type="text"
                    className="pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={e=>setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={()=>setShowFilters(!showFilters)} className="p-2 border rounded-lg">
                  <FaFilter />
                </button>
              </div>
            </div>
            {showFilters && activeTab==='all' && (
              <div className="p-4 bg-gray-50 border-t">
                {['','available','claimed','completed','expired'].map(st => (
                  <button key={st} onClick={()=>setStatusFilter(st)} className={`mr-2 mb-2 py-1 px-3 rounded-full text-sm ${statusFilter===st?'bg-green-100 text-green-800':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{st? (st==='available'?'Pending':st==='claimed'?'In Progress':st==='completed'?'Completed':'Expired'):'All'}</button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow border">
              <LoadingSpinner size="md" color="text-green-500" />
              <p className="mt-4 text-gray-600">Loading your reports...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow border">
              <FaExclamationCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-800 mb-2">No reports found</p>
              <p className="text-gray-600 mb-6">{activeTab==='all'?'You have not submitted any cleanup reports yet.':'No reports in this category.'}</p>
              <button onClick={openAddTask} className="btn-primary">Report New Task</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                <FoodCard key={task._id} food={task} onStatusChange={fetchTasks} />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}