'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Extend the user type to include role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Get the user role in a type-safe way
  const getUserRole = (): string => {
    return (session?.user as ExtendedUser)?.role || '';
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md text-gray-800' : 'bg-gradient-to-r from-green-600 to-green-700 text-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 text-xl font-bold flex items-center">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10V14C20 18.4183 16.4183 22 12 22C7.58172 22 4 18.4183 4 14V10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z" 
                      stroke={scrolled ? "#16a34a" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 5C15 5 14.2 7 12 7C9.8 7 9 5 9 5" 
                      stroke={scrolled ? "#16a34a" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`font-bold tracking-tight ${scrolled ? 'text-gradient' : ''}`}>
                FoodSaver
              </span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                  ${isActive('/') 
                    ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                    : (scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700')}`}
              >
                Home
              </Link>
              
              {session ? (
                <>
                  <Link 
                    href={getUserRole() === 'restaurant' ? '/restaurant-dashboard' : '/ngo-dashboard'} 
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                      ${isActive('/restaurant-dashboard') || isActive('/ngo-dashboard')
                        ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                        : (scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700')}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/messages" 
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                      ${isActive('/messages')
                        ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                        : (scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700')}`}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Messages
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                      ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700'}`}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 
                      ${isActive('/login')
                        ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                        : (scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700')}`}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className={`${scrolled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white text-green-700 hover:bg-green-50'} 
                      px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all duration-200`}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors
                ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-green-700'}`}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`md:hidden animate-fade-in ${scrolled ? 'bg-white' : 'bg-green-600'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200
                ${isActive('/') 
                  ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                  : (scrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-green-700 text-white')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {session ? (
              <>
                <Link 
                  href={getUserRole() === 'restaurant' ? '/restaurant-dashboard' : '/ngo-dashboard'} 
                  className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive('/restaurant-dashboard') || isActive('/ngo-dashboard')
                      ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                      : (scrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-green-700 text-white')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/messages" 
                  className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive('/messages')
                      ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                      : (scrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-green-700 text-white')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Messages
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className={`block px-3 py-2 rounded-lg font-medium w-full text-left transition-all duration-200
                    ${scrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-green-700 text-white'}`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive('/login')
                      ? (scrolled ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white')
                      : (scrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-green-700 text-white')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className={`block px-3 py-3 rounded-lg font-medium text-center transition-all duration-200 mt-3
                    ${scrolled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white text-green-700 hover:bg-green-50'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 