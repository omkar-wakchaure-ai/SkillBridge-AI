import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearnerProfile } from '../context/LearnerProfileCtx';
import {
  calculatePhaseProgress,
  calculateProgress,
  generateRoadmap,
  getCourseProgress
} from '../utils/roadmapEngine';
import RoadmapTimeline from '../components/learning/RoadmapTimeline';

const LearningPath = () => {
  const navigate = useNavigate();
  const { profile, markCourseComplete } = useLearnerProfile();

  const roadmap = useMemo(() => generateRoadmap(profile), [profile]);
  const overallProgress = calculateProgress(profile);

  const phases = useMemo(() => {
    if (!roadmap) return [];

    return roadmap.phases.map((phase, idx) => {
      const progress = calculatePhaseProgress(phase, profile.progress);
      const completed = profile.progress?.completedPhases?.includes(phase.id)
        || (phase.courses?.length > 0 && progress === 100);
      const previousPhasesCompleted = roadmap.phases
        .slice(0, idx)
        .every(previousPhase => (
          !previousPhase.courses?.length
          || profile.progress?.completedPhases?.includes(previousPhase.id)
          || calculatePhaseProgress(previousPhase, profile.progress) === 100
        ));
      const status = completed
        ? 'Completed'
        : idx === 0 || previousPhasesCompleted
          ? 'In Progress'
          : 'Locked';

      return {
        ...phase,
        status,
        progress,
        skills: phase.skills || [],
        resources: (phase.courses || []).map(c => ({
          courseId: c.id,
          title: c.title,
          channel: c.domain,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${c.title} ${c.domain} tutorial`)}`,
          duration: c.duration,
          completed: getCourseProgress(profile.progress, c.id) === 100
        }))
      };
    });
  }, [roadmap, profile.progress]);

  if (!roadmap || phases.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen font-sans animate-in fade-in duration-500">
        <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-6 shadow-sm">
            🗺️
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">No Roadmap Yet</h1>
          <p className="text-slate-500 font-medium text-sm mb-8 max-w-md mx-auto">
            Complete your onboarding to generate a personalized learning roadmap tailored to your goals.
          </p>
          <button 
            onClick={() => navigate('/onboarding')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen font-sans animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-200">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-widest mb-4 inline-block">Personalized Roadmap</span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{profile.careerGoal || profile.selectedStream}</h1>
        <p className="text-slate-500 font-medium text-sm mt-2 max-w-2xl">
          A {roadmap.totalWeeks}-week learning path for {profile.selectedStream}
          {profile.selectedDomains?.length > 0 ? ` focusing on ${profile.selectedDomains.join(', ')}` : ''}.
          Based on your {profile.dailyStudyMinutes} min/day, {profile.studyDays?.length || 0} days/week schedule.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            📅 {profile.targetMonths} months
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            ⏱️ {profile.dailyStudyMinutes} min/day
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            📆 {profile.studyDays?.length || 0} days/week
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Overall video progress</span>
            <span className="text-indigo-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <RoadmapTimeline
        phases={phases}
        overallProgress={overallProgress}
        onCompleteVideo={markCourseComplete}
      />
    </div>
  );
};

export default LearningPath;
