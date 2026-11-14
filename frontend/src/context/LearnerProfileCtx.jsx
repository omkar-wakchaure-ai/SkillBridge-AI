import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DEFAULT_PROFILE, STREAMS } from '../config/streamConfig';
import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';

const LearnerProfileContext = createContext();

const RESUMABLE_PATHS = new Set([
  '/onboarding',
  '/dashboard',
  '/profile',
  '/career',
  '/learning',
  '/roleplay',
  '/certifications',
  '/analytics',
  '/courses',
  '/resume-analysis'
]);

export const isResumablePath = (path) => RESUMABLE_PATHS.has(path);

export const LearnerProfileProvider = ({ children }) => {
  const { token } = useAuth();
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE });
  const [lastPath, setLastPath] = useState('/dashboard');
  const [activityStatus, setActivityStatus] = useState(
    localStorage.getItem('pathpilot_token') ? 'loading' : 'ready'
  );
  const [activityError, setActivityError] = useState('');
  const activityLoadRef = useRef({ token: null, promise: null });

  const loadActivity = useCallback(async () => {
    const savedToken = localStorage.getItem('pathpilot_token');
    if (!savedToken) {
      activityLoadRef.current = { token: null, promise: null };
      setProfile({ ...DEFAULT_PROFILE });
      setLastPath('/dashboard');
      setActivityError('');
      setActivityStatus('ready');
      return null;
    }

    const inFlight = activityLoadRef.current;
    if (inFlight.token === savedToken && inFlight.promise) return inFlight.promise;

    setActivityStatus('loading');
    setActivityError('');
    const promise = apiClient('/activity/me').then((activity) => {
      if (activityLoadRef.current.token !== savedToken) return null;
      const savedProfile = activity?.profile_data || {};
      setProfile({
        ...DEFAULT_PROFILE,
        ...savedProfile,
        progress: { ...DEFAULT_PROFILE.progress, ...savedProfile.progress }
      });
      setLastPath(isResumablePath(activity?.last_path) ? activity.last_path : '/dashboard');
      setActivityStatus('ready');
      return activity;
    }).catch((error) => {
      if (activityLoadRef.current.token !== savedToken) return null;
      setActivityError(error.message || 'Could not load saved learning activity.');
      setActivityStatus('error');
      return null;
    });
    activityLoadRef.current = { token: savedToken, promise };
    promise.then(() => {
      if (activityLoadRef.current.promise === promise) {
        activityLoadRef.current.promise = null;
      }
    });
    return promise;
  }, []);

  useEffect(() => {
    loadActivity();
  }, [token, loadActivity]);

  useEffect(() => {
    if (!token || activityStatus !== 'ready') return undefined;

    const timer = setTimeout(async () => {
      try {
        await apiClient('/activity/me', {
          method: 'PUT',
          body: JSON.stringify({ profile_data: profile, last_path: lastPath })
        });
        setActivityError('');
      } catch (error) {
        setActivityError(error.message || 'Could not save learning activity.');
        setActivityStatus('error');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [activityStatus, lastPath, profile, token]);

  const updateProfile = useCallback((key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateLastPath = useCallback((path) => {
    if (isResumablePath(path)) setLastPath(path);
  }, []);

  const updateProfileMulti = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE });
  }, []);

  const completeOnboarding = useCallback((onboardingData) => {
    setProfile(prev => ({
      ...prev,
      ...onboardingData,
      onboardingComplete: true
    }));
  }, []);

  const updateProgress = useCallback((progressUpdates) => {
    setProfile(prev => ({
      ...prev,
      progress: { ...prev.progress, ...progressUpdates }
    }));
  }, []);

  const markCourseComplete = useCallback((courseId) => {
    const courseKey = String(courseId);
    setProfile(prev => {
      const progress = prev.progress || {};
      const completedCourses = Array.isArray(progress.completedCourses)
        ? progress.completedCourses
        : [];
      const alreadyCompleted = completedCourses.some(id => String(id) === courseKey);
      if (alreadyCompleted && Number(progress.courseProgress?.[courseKey]) === 100) return prev;

      return {
        ...prev,
        progress: {
          ...progress,
          completedCourses: alreadyCompleted ? completedCourses : [...completedCourses, courseId],
          courseProgress: {
            ...progress.courseProgress,
            [courseKey]: 100
          }
        }
      };
    });
  }, []);

  const addNotification = useCallback((notification) => {
    setProfile(prev => {
      const exists = prev.notifications.some(n => n.id === notification.id);
      if (exists) return prev;
      return {
        ...prev,
        notifications: [
          { read: false, timestamp: new Date().toISOString(), ...notification },
          ...prev.notifications
        ]
      };
    });
  }, []);

  const setNotifications = useCallback((notifications) => {
    setProfile(prev => ({ ...prev, notifications }));
  }, []);

  const markNotificationRead = useCallback((notifId) => {
    setProfile(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      )
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  }, []);

  const weeklyAvailableMinutes = profile.dailyStudyMinutes * profile.studyDays.length;
  const monthlyAvailableMinutes = weeklyAvailableMinutes * 4.33;
  const totalAvailableMinutes = monthlyAvailableMinutes * profile.targetMonths;

  const getStreamConfig = useCallback(() => {
    return STREAMS[profile.selectedStream] || null;
  }, [profile.selectedStream]);

  return (
    <LearnerProfileContext.Provider value={{
      profile,
      lastPath,
      activityStatus,
      activityError,
      reloadActivity: loadActivity,
      updateLastPath,
      updateProfile,
      updateProfileMulti,
      resetProfile,
      completeOnboarding,
      updateProgress,
      markCourseComplete,
      addNotification,
      setNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      weeklyAvailableMinutes,
      monthlyAvailableMinutes,
      totalAvailableMinutes,
      getStreamConfig
    }}>
      {children}
    </LearnerProfileContext.Provider>
  );
};

export const useLearnerProfile = () => {
  const ctx = useContext(LearnerProfileContext);
  if (!ctx) throw new Error('useLearnerProfile must be used within LearnerProfileProvider');
  return ctx;
};
