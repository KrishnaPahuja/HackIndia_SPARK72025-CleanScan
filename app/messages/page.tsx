'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Chat from '@/components/Chat';

// Extend the user type to include role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Get the user role in a type-safe way
  const getUserRole = (): string => {
    return (session?.user as ExtendedUser)?.role || '';
  };
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Loading your messages...</p>
          <p className="mt-2 text-gray-500">Please wait while we connect you</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="relative">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Messages</h1>
            <div className="h-1.5 w-20 bg-green-500 rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg max-w-xl">
              {getUserRole() === 'restaurant' 
                ? 'Connect with NGOs about your food donations and coordinate deliveries in real-time.' 
                : 'Communicate with restaurants about their donations and arrange pickup details effortlessly.'}
            </p>
          </div>
          
          <div className="mt-8 md:mt-0 p-5 bg-white rounded-xl border border-gray-100 max-w-md shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>
            <div className="flex items-start">
              <div className="text-green-600 mr-4 bg-green-50 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">How it works</h3>
                <p className="text-gray-600">
                  {getUserRole() === 'restaurant' 
                    ? 'This messaging system connects you with NGOs. You can chat with NGOs that have claimed your food donations, or start a new conversation with any registered NGO using the "New Message" button.'
                    : 'This messaging system connects you with restaurants that have food donations you\'ve claimed. Use it to arrange pickup details and ask any questions.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Chat />
      </main>
    </div>
  );
} 