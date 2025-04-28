'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { FaBars, FaTimes, FaBowlFood, FaUtensils, FaHandHoldingHeart } from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner";

// Extend the user type to include role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalFood: 0,
    totalRestaurants: 0,
    totalNGOs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch some stats (this would normally come from an API)
    // This is just dummy data for now
    setStats({
      totalFood: 158,
      totalRestaurants: 42,
      totalNGOs: 23,
    });

    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Function to determine the dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!session?.user) return '/ngo-dashboard';
    return (session.user as ExtendedUser)?.role === 'restaurant' 
      ? '/restaurant-dashboard' 
      : '/ngo-dashboard';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-16 mt-16 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center py-12">
            <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
                Reducing Food Waste Together
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Save Food, <span className="text-yellow-300">Save Lives</span>
              </h1>
              <p className="text-xl mb-8 text-white/90 leading-relaxed">
                Connect restaurants with excess food to organizations that help those in need. Join our mission to reduce waste and fight hunger.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {!session ? (
                  <Link
                    href="/register"
                    className="bg-white text-green-600 font-bold rounded-full px-8 py-4 text-center hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Join Now
                  </Link>
                ) : (
                  <Link
                    href={getDashboardUrl()}
                    className="bg-white text-green-600 font-bold rounded-full px-8 py-4 text-center hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Go to Dashboard
                  </Link>
                )}
                <Link
                  href="/about"
                  className="border-2 border-white text-white font-bold rounded-full px-8 py-4 text-center hover:bg-white/10 transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-72 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden shadow-2xl transform md:rotate-2 hover:rotate-0 transition-all duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Food donation"
                  fill
                  priority
                  className="transition-transform duration-700 hover:scale-110"
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="bg-green-600/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                    <p className="font-medium">Join 42+ restaurants fighting food waste</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="h-16 w-full overflow-hidden relative">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100H1440V0C1440 0 1320 60 1200 60C1080 60 1020 0 900 0C780 0 720 60 600 60C480 60 420 0 300 0C180 0 120 60 0 60V100Z" fill="white" />
          </svg>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Together we're making a difference in our communities and environment</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="feature-card">
              <div className="flex flex-col items-center">
                <div className="mb-4 bg-green-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="relative mb-2">
                  <span className="text-5xl font-bold text-gray-900">{stats.totalFood}</span>
                  <span className="absolute -top-2 -right-4 text-xs font-bold bg-green-100 text-green-800 py-1 px-2 rounded-full">+23%</span>
                </div>
                <p className="text-gray-600 font-medium">Food Items Donated</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="flex flex-col items-center">
                <div className="mb-4 bg-blue-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="relative mb-2">
                  <span className="text-5xl font-bold text-gray-900">{stats.totalRestaurants}</span>
                  <span className="absolute -top-2 -right-4 text-xs font-bold bg-blue-100 text-blue-800 py-1 px-2 rounded-full">+12%</span>
                </div>
                <p className="text-gray-600 font-medium">Participating Restaurants</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="flex flex-col items-center">
                <div className="mb-4 bg-yellow-100 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="relative mb-2">
                  <span className="text-5xl font-bold text-gray-900">{stats.totalNGOs}</span>
                  <span className="absolute -top-2 -right-4 text-xs font-bold bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full">+8%</span>
                </div>
                <p className="text-gray-600 font-medium">Food Banks & NGOs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-4 py-1.5 rounded-full">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 mb-6">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Our platform makes donating and receiving food simple and efficient</p>
          </div>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600 transform -translate-y-1/2 z-0"></div>
            
            <div className="relative z-10">
              <div className="text-center">
                <div className="bg-white rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-100">
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Register</h3>
                <p className="text-gray-600">
                  Sign up as a restaurant with excess food or as an organization that accepts donations.
                </p>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center">
                <div className="bg-white rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-100">
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Donate or Claim</h3>
                <p className="text-gray-600">
                  Restaurants list available food, and NGOs/food banks can claim and pick it up.
                </p>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center">
                <div className="bg-white rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-100">
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Rate & Review</h3>
                <p className="text-gray-600">
                  After receiving food, NGOs can rate restaurants to build trust in the community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Section - different content based on login status */}
      {!session ? (
        <div className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
              Join Our Community
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto text-white/90">
              Join our platform today and be part of the solution to reduce food waste while helping those in need.
            </p>
            <Link
              href="/register"
              className="bg-white text-green-600 font-bold rounded-full px-10 py-4 text-center hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Started Today
            </Link>
            <p className="mt-6 text-sm text-white/70">No credit card required. Start reducing waste immediately.</p>
          </div>
        </div>
      ) : (
        <div className="py-16 bg-gradient-to-br from-green-600 to-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="mb-6 text-lg max-w-3xl mx-auto">
              Thank you for being part of our food waste reduction community. Continue making a difference!
            </p>
            <Link
              href={getDashboardUrl()}
              className="bg-white text-green-600 font-bold rounded-full px-8 py-3 text-center hover:bg-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
      
      {/* Simple Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <svg className="h-8 w-8 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 10V14C20 18.4183 16.4183 22 12 22C7.58172 22 4 18.4183 4 14V10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 5C15 5 14.2 7 12 7C9.8 7 9 5 9 5" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-bold text-white">FoodSaver</span>
              </div>
              <p className="text-sm mt-2">© 2023 FoodSaver. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 