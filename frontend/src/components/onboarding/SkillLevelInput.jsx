import React, { useState } from 'react';
import { STREAMS } from '../../config/streamConfig';

const PROFICIENCY_LEVELS = [
  { value: 0, label: 'Beginner', description: 'New to this' },
  { value: 25, label: 'Basic', description: 'Know a little' },
  { value: 50, label: 'Intermediate', description: 'Can use it' },
  { value: 75, label: 'Advanced', description: 'Confident' },
  { value: 100, label: 'Expert', description: 'Can teach it' }
];

const SkillLevelInput = ({ skills = {}, onChange, selectedStream }) => {
  const [search, setSearch] = useState('');
  const categories = STREAMS[selectedStream]?.capabilities || {
    Skills: ['Python', 'SQL', 'Java', 'React JS']
  };
  const categoryEntries = Object.entries(categories);
  const allSkills = [...new Set(categoryEntries.flatMap(([, categorySkills]) => categorySkills))];
  const [openCategory, setOpenCategory] = useState(categoryEntries[0]?.[0] || '');
  const searchTerm = search.trim().toLowerCase();
  const ratedCount = allSkills.filter(skill =>
    Object.prototype.hasOwnProperty.call(skills, skill)
  ).length;

  const setUnratedSkillsToBeginner = (skillsToUpdate) => {
    skillsToUpdate.forEach(skill => {
      if (!Object.prototype.hasOwnProperty.call(skills, skill)) {
        onChange(skill, 0);
      }
    });
  };

  const visibleCategories = categoryEntries
    .map(([category, categorySkills]) => [
      category,
      categorySkills.filter(skill => skill.toLowerCase().includes(searchTerm))
    ])
    .filter(([, categorySkills]) => categorySkills.length > 0);

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="hidden md:flex flex-1 relative justify-center items-center h-full min-h-[350px]">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-[60px] opacity-80 animate-pulse-slow"></div>
        <img
          src="/ChatGPT Image Sep 2, 2026, 08_06_48 AM.png"
          alt="Skill assessment visualization"
          className="relative z-10 w-full max-w-[420px] h-auto object-contain drop-shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-700"
        />
      </div>

      <div className="flex-1 w-full min-w-0">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Your current skills</h2>
        <p className="text-slate-500 text-sm mb-5 font-medium">
          Choose a level only for skills you know. Your answers help us personalize your path.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Want a faster start?</p>
            <p className="text-xs text-slate-500 mt-1">
              Set unrated skills to beginner, then adjust the ones you know.
            </p>
          </div>
          <button
            type="button"
            disabled={ratedCount === allSkills.length}
            onClick={() => setUnratedSkillsToBeginner(allSkills)}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Set {allSkills.length - ratedCount} to beginner
          </button>
        </div>

        <label className="block mb-4">
          <span className="sr-only">Search skills</span>
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search skills..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500">Your skill levels</span>
          <span className="text-xs font-bold text-indigo-600">{ratedCount} of {allSkills.length} set</span>
        </div>

        {visibleCategories.length > 0 ? (
          <div className="space-y-3">
            {visibleCategories.map(([category, categorySkills]) => {
              const isOpen = Boolean(searchTerm) || openCategory === category;
              const categoryRatedCount = categorySkills.filter(skill =>
                Object.prototype.hasOwnProperty.call(skills, skill)
              ).length;

              return (
                <section key={category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    disabled={Boolean(searchTerm)}
                    aria-expanded={isOpen}
                    onClick={() => setOpenCategory(isOpen ? '' : category)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50 disabled:cursor-default transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800">{category}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {categoryRatedCount} of {categorySkills.length} set
                      </span>
                    </span>
                    <span className="text-lg font-medium text-indigo-600" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 p-3 sm:p-4 space-y-2">
                      {categorySkills.map(skill => {
                        const isRated = Object.prototype.hasOwnProperty.call(skills, skill);
                        const level = PROFICIENCY_LEVELS.find(item => item.value === skills[skill]);

                        return (
                          <div
                            key={skill}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                          >
                            <div className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-700">{skill}</span>
                              <span className={`mt-1 block text-xs font-medium ${isRated ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {isRated ? `${level?.label || 'Selected'} · ${skills[skill]}%` : 'Choose your level'}
                              </span>
                            </div>
                            <select
                              aria-label={`Your level in ${skill}`}
                              value={isRated ? String(skills[skill]) : ''}
                              onChange={event => onChange(skill, Number(event.target.value))}
                              className="w-full sm:w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                              <option value="" disabled>Select a level</option>
                              {PROFICIENCY_LEVELS.map(proficiency => (
                                <option key={proficiency.value} value={proficiency.value}>
                                  {proficiency.label} — {proficiency.description}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}

                      {categoryRatedCount < categorySkills.length && (
                        <button
                          type="button"
                          onClick={() => setUnratedSkillsToBeginner(categorySkills)}
                          className="px-1 pt-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Set unrated in this group to beginner
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No skills match “{search}”. Try another search.
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillLevelInput;
