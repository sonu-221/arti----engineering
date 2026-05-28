
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Project, ProjectStatus } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: '',
    budget: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    refreshProjects();
  }, []);
  
  const refreshProjects = () => {
    setProjects(db.projects.getAll());
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectForm.name,
        location: projectForm.location,
        budget: Number(projectForm.budget),
        startDate: projectForm.startDate,
        endDate: projectForm.endDate, // Can be empty string
        status: ProjectStatus.PLANNING,
        progress: 0
    };
    db.projects.save(newProject);
    refreshProjects();
    setIsProjectModalOpen(false);
    setProjectForm({ name: '', location: '', budget: '', startDate: '', endDate: '' });
  };

  const handleUpdateProgress = (id: string, currentProgress: number) => {
    const newProgress = Math.min(currentProgress + 5, 100);
    const updates: Partial<Project> = { progress: newProgress };
    
    if (newProgress === 100) updates.status = ProjectStatus.COMPLETED;
    else if (newProgress > 0 && newProgress < 100) updates.status = ProjectStatus.IN_PROGRESS;
    
    db.projects.update(id, updates);
    refreshProjects();
  };

  const handleFinishProject = (id: string) => {
    db.projects.update(id, { progress: 100, status: ProjectStatus.COMPLETED });
    refreshProjects();
  };

  const handleProjectImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        db.projects.update(id, { image: reader.result as string });
        refreshProjects();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
           <h2 className="font-oswald font-bold uppercase text-2xl text-slate-900 tracking-tight">Active Projects</h2>
           <p className="text-gray-400 text-xs mt-1">Manage construction sites and progress</p>
        </div>
        <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Create New Project
        </button>
      </div>

      {projects.length === 0 ? (
            <div className="bg-white p-10 md:p-20 rounded-3xl border border-gray-100 text-center shadow-sm">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 text-gray-400">
                    <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                </div>
                <h3 className="text-gray-900 font-bold text-lg uppercase">No Active Projects</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">Start by creating a new construction project to track progress, budget and timelines.</p>
            </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                      {/* Responsive Image/Icon Container: h-40 on mobile, h-56 on desktop */}
                      <div className="relative h-40 md:h-56 bg-gray-200 group shrink-0">
                          {project.image ? (
                              <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                  {/* Scaled Icon: w-8 on mobile, w-12 on desktop */}
                                  <svg className="w-8 h-8 md:w-12 md:h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                  <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                              </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <label className="cursor-pointer bg-white text-gray-900 px-5 py-3 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-gray-50 transition-colors transform hover:scale-105">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                  Upload Photo
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProjectImage(project.id, e)} />
                              </label>
                          </div>

                          <div className="absolute top-4 right-4 z-10">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                  project.status === ProjectStatus.COMPLETED ? 'bg-green-500 text-white' :
                                  project.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-600 text-white' :
                                  'bg-white text-slate-800'
                              }`}>
                                  {project.status.replace('_', ' ')}
                              </span>
                          </div>
                      </div>

                      <div className="p-4 md:p-6 flex-1 flex flex-col">
                          <h4 className="font-oswald font-bold text-xl md:text-2xl text-slate-900 uppercase tracking-tight">{project.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                              <span className="text-xs font-bold uppercase tracking-wider">{project.location}</span>
                          </div>

                          <div className="mt-6 md:mt-8">
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Completion</span>
                                  <span className="font-oswald font-bold text-slate-900">{project.progress}%</span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full rounded-full transition-all duration-700 ${project.status === ProjectStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-600'}`} 
                                      style={{ width: `${project.progress}%` }}
                                  ></div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-6 md:mt-8 py-4 md:py-5 border-t border-gray-100">
                              <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Budget</p>
                                  <p className="font-oswald font-bold text-slate-900 text-lg md:text-xl mt-1">₹{project.budget.toLocaleString()}</p>
                              </div>
                              <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deadline</p>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                      <p className="font-bold text-slate-700 text-sm">
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"}
                                      </p>
                                  </div>
                              </div>
                          </div>

                          <div className="flex gap-3 mt-auto pt-4">
                              <button 
                                  onClick={() => handleUpdateProgress(project.id, project.progress)}
                                  disabled={project.status === ProjectStatus.COMPLETED}
                                  className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  +5% Update
                              </button>
                              <button 
                                  onClick={() => handleFinishProject(project.id)}
                                  disabled={project.status === ProjectStatus.COMPLETED}
                                  className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1 ${
                                      project.status === ProjectStatus.COMPLETED 
                                      ? 'bg-green-100 text-green-700 opacity-100' 
                                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                                  }`}
                              >
                                  {project.status === ProjectStatus.COMPLETED ? (
                                      <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                          Done
                                      </>
                                  ) : (
                                      <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                          Finish
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-oswald font-bold text-xl text-slate-800">Create New Project</h3>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-slate-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. City Mall Renovation"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                    value={projectForm.name}
                    onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                  />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 123 Main St, New York"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={projectForm.location}
                      onChange={e => setProjectForm({...projectForm, location: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Budget (₹)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="50000"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={projectForm.budget}
                      onChange={e => setProjectForm({...projectForm, budget: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={projectForm.startDate}
                      onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estimated End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={projectForm.endDate}
                      onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                    />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsProjectModalOpen(false)}
                    className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-3.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;
