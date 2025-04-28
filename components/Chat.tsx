'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ChatList from './ChatList';

export default function Chat() {
  const { data: session } = useSession();
  const [error, setError] = useState('');

  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Messages</h2>
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-lg mb-3">Please log in to access messaging</p>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Once logged in, you'll be able to communicate directly with restaurants and NGOs to coordinate food donations.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatList />
  );
}