import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import EmployeeForm from './pages/EmployeeForm';
import StatusTracker from './pages/StatusTracker';
import AdminLogin from './pages/AdminLogin';
import OBCDashboard from './pages/OBCDashboard';
import HealthCentreDashboard from './pages/HealthCentreDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PublicQueryResponse from './pages/PublicQueryResponse';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gov-neutral-50">
          <Header />
          <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8" role="main">
            <Routes>
              <Route path="/" element={<EmployeeForm />} />
              <Route path="/status" element={<StatusTracker />} />
              <Route path="/query/:token" element={<PublicQueryResponse />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/obc" element={<OBCDashboard />} />
              <Route path="/admin/health-centre" element={<HealthCentreDashboard />} />
              <Route path="/admin/super" element={<SuperAdminDashboard />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-gov-neutral-800 text-gov-neutral-300 mt-16" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                  <ul className="space-y-3">
                    <li><a href="#" className="hover:text-white transition-colors">Submit New Claim</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Track Application</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Download Forms</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
                  <ul className="space-y-3">
                    <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Help Centre</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Technical Issues</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">University</h3>
                  <ul className="space-y-3">
                    <li><a href="https://www.jnu.ac.in" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">JNU Main Site</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Academic Calendar</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Departments</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Administration</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Info</h3>
                  <div className="space-y-3 text-sm">
                    <p>Medical Centre, JNU<br />New Mehrauli Road<br />New Delhi - 110067</p>
                    <p>Phone: 011-26704077<br />Email: medical@jnu.ac.in</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gov-neutral-700 mt-8 pt-8 text-sm text-center">
                <p>&copy; {new Date().getFullYear()} Jawaharlal Nehru University. All rights reserved.</p>
                <p className="mt-2">
                  <a href="#" className="hover:text-white transition-colors mr-4">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors mr-4">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Accessibility Statement</a>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;