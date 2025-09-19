import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, FileText, Search, Shield, Menu, X, Phone, Mail, Globe } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActivePath = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <header className="bg-white shadow-gov-md" role="banner">
        <div className="max-w-7xl mx-auto">
          {/* Government top bar */}
          <div className="hidden md:block border-b border-gov-neutral-200 bg-gov-neutral-50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-2 text-sm">
                <nav className="flex space-x-6" aria-label="Quick Links">
                  <a href="https://www.jnu.ac.in" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors" 
                     target="_blank" rel="noopener noreferrer">
                    JNU Main Site
                  </a>
                  <a href="#" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors">RTI</a>
                  <a href="#" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors">Directory</a>
                  <a href="#" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors">Contact Us</a>
                  <a href="#" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors">Emergency Services</a>
                  <a href="#" className="text-gov-neutral-600 hover:text-gov-primary-600 transition-colors">Holidays</a>
                </nav>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-4 text-gov-neutral-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>011-26704077</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>medical@jnu.ac.in</span>
                    </div>
                  </div>
                  <button 
                    className="flex items-center space-x-1 text-gov-primary-600 hover:text-gov-primary-700 font-medium transition-colors"
                    aria-label="Switch to Hindi"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-hindi">हिंदी</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center justify-between">
              {/* Logo and title section */}
              <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-gov-primary-600 to-gov-primary-800 rounded-full flex items-center justify-center shadow-gov-md">
                    <GraduationCap className="w-10 h-10 lg:w-12 lg:h-12 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-responsive-h2 text-gov-primary-800 font-bold font-hindi leading-tight">
                    जवाहरलाल नेहरू विश्वविद्यालय
                  </h1>
                  <p className="text-lg lg:text-xl text-gov-primary-700 font-semibold mt-1">
                    Jawaharlal Nehru University
                  </p>
                  <p className="text-sm lg:text-base text-gov-neutral-600 mt-1 font-medium">
                    Medical Reimbursement Portal
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-2" aria-label="Main Navigation">
                <Link 
                  to="/" 
                  className={`nav-gov-link flex items-center space-x-2 px-4 py-2 ${
                    isActivePath('/') ? 'nav-gov-link-active' : ''
                  }`}
                  aria-current={isActivePath('/') ? 'page' : undefined}
                >
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  <span>Submit Claim</span>
                </Link>
                <Link 
                  to="/status" 
                  className={`nav-gov-link flex items-center space-x-2 px-4 py-2 ${
                    isActivePath('/status') ? 'nav-gov-link-active' : ''
                  }`}
                  aria-current={isActivePath('/status') ? 'page' : undefined}
                >
                  <Search className="w-5 h-5" aria-hidden="true" />
                  <span>Track Status</span>
                </Link>
                <Link 
                  to="/admin/login" 
                  className={`nav-gov-link flex items-center space-x-2 px-4 py-2 ${
                    isActivePath('/admin/login') ? 'nav-gov-link-active' : ''
                  }`}
                  aria-current={isActivePath('/admin/login') ? 'page' : undefined}
                >
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  <span>Admin Portal</span>
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 rounded-gov text-gov-neutral-600 hover:text-gov-primary-600 hover:bg-gov-neutral-100 transition-colors"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gov-neutral-200 bg-gov-neutral-50" role="navigation" aria-label="Mobile Navigation">
              <div className="px-4 py-4 space-y-2">
                <Link 
                  to="/" 
                  className={`nav-gov-link flex items-center space-x-3 px-3 py-3 w-full text-left rounded-gov ${
                    isActivePath('/') ? 'nav-gov-link-active' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActivePath('/') ? 'page' : undefined}
                >
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Submit Medical Claim</span>
                </Link>
                <Link 
                  to="/status" 
                  className={`nav-gov-link flex items-center space-x-3 px-3 py-3 w-full text-left rounded-gov ${
                    isActivePath('/status') ? 'nav-gov-link-active' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActivePath('/status') ? 'page' : undefined}
                >
                  <Search className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Track Application Status</span>
                </Link>
                <Link 
                  to="/admin/login" 
                  className={`nav-gov-link flex items-center space-x-3 px-3 py-3 w-full text-left rounded-gov ${
                    isActivePath('/admin/login') ? 'nav-gov-link-active' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActivePath('/admin/login') ? 'page' : undefined}
                >
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Administrator Portal</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;