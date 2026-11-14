import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Route,
  Target,
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const SkillChip = ({ label, variant }) => {
  const styles =
    variant === 'missing'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const Icon = variant === 'missing' ? AlertTriangle : CheckCircle2;

  return (
    <motion.span
      variants={item}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${styles}`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </motion.span>
  );
};

const GapAnalysisDashboard = ({ analysis }) => {
  const { target_job_title: role, current_skills, missing_skills, learning_roadmap } =
    analysis;
  const totalComparedSkills = current_skills.length + missing_skills.length;
  const matchPercentage = totalComparedSkills
    ? Math.round((current_skills.length / totalComparedSkills) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Target role
              </p>
              <h2 className="text-2xl font-black text-slate-900">{role}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Your personalized gap analysis is ready.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Match', value: `${matchPercentage}%`, tone: 'text-indigo-600' },
              { label: 'Matched', value: current_skills.length, tone: 'text-emerald-600' },
              { label: 'Gaps', value: missing_skills.length, tone: 'text-rose-600' },
              { label: 'Steps', value: learning_roadmap.length, tone: 'text-indigo-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center"
              >
                <p className={`text-2xl font-black ${stat.tone}`}>{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Current Skills
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {current_skills.map((skill) => (
              <SkillChip key={skill} label={skill} variant="current" />
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Missing Skills
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing_skills.map((skill) => (
              <SkillChip key={skill} label={skill} variant="missing" />
            ))}
          </div>
        </motion.section>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Route className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
            Learning Roadmap
          </h3>
        </div>

        <ol className="relative space-y-6 border-l-2 border-dashed border-indigo-100 pl-8">
          {learning_roadmap.map((step, index) => (
            <motion.li
              key={`${step.title}-${index}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="relative"
            >
              <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white ring-4 ring-white">
                {index + 1}
              </span>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-sm font-black text-slate-900">{step.title}</h4>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-600 ring-1 ring-indigo-100">
                    <Clock className="h-3 w-3" />
                    {step.estimated_time}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default GapAnalysisDashboard;
