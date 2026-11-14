import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLearnerProfile } from '../context/LearnerProfileCtx';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const { activityStatus, activityError, reloadActivity } = useLearnerProfile();

  if (loading || activityStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#B3CFE5]">
        <div className="text-slate-500 font-bold text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#B3CFE5] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {activityStatus === 'error' && (
            <div role="alert" className="flex items-center justify-between gap-4 bg-amber-50 px-6 py-3 text-sm text-amber-900">
              <span>Learning progress could not sync: {activityError}</span>
              <button onClick={reloadActivity} className="font-bold underline">Retry</button>
            </div>
          )}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
