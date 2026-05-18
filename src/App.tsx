/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  useNavigate, 
  useParams, 
  useLocation,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { 
  Sparkles, 
  Video, 
  Scissors, 
  Upload, 
  ChevronRight, 
  Loader2, 
  Plus, 
  History,
  Info,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Trash2,
  Fingerprint,
  UserCog
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from './services/geminiService';
import { cn } from './lib/utils';

type Phase = 'plan' | 'produce' | 'edit' | 'publish' | 'branding' | 'avatar';

interface Project {
  id: string;
  name: string;
  plan?: string;
  prompts?: string;
  editAdvice?: string;
  publishingData?: string;
  brandingAdvice?: string;
  avatarAdvice?: string;
  // User manual inputs for each phase
  userInputPlan?: string;
  userInputProduce?: string;
  userInputEdit?: string;
  userInputPublish?: string;
  userInputBranding?: string;
  userInputAvatar?: string;
  editOptions?: {
    transitions: string;
    effects: string;
    timestamps: string;
  };
  // Feedback fields
  feedback?: Record<Phase, { rating: number; comment: string }>;
  abTests?: {
    headlineA: string;
    headlineB: string;
    winner?: 'A' | 'B';
  };
  currentPhase: Phase;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreatorFlow />} />
      <Route path="/:projectId" element={<CreatorFlow />} />
      <Route path="/:projectId/:phase" element={<CreatorFlow />} />
    </Routes>
  );
}

function CreatorFlow() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('creatorflow_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();
  const { projectId, phase: urlPhase } = useParams<{ projectId: string; phase: string }>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('creatorflow_projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === projectId);
  const currentPhase = (urlPhase as Phase) || activeProject?.currentPhase || 'plan';

  useEffect(() => {
    // Sync URL if needed (e.g. if we went to /projectId but not phase)
    if (projectId && !urlPhase && activeProject) {
      navigate(`/${projectId}/${activeProject.currentPhase}`, { replace: true });
    }
  }, [projectId, urlPhase, activeProject, navigate]);

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Jeste li sigurni da želite obrisati ovaj projekt?')) {
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      if (projectId === id) {
        navigate('/');
      }
    }
  };

  const startNewProject = () => {
    const id = Date.now().toString();
    const newProject: Project = {
      id,
      name: 'Naslovno remek-djelo',
      currentPhase: 'plan'
    };
    setProjects([newProject, ...projects]);
    navigate(`/${id}/plan`);
  };

  const updateProject = (updates: Partial<Project>) => {
    if (!projectId) return;
    setProjects(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
    
    if (updates.currentPhase) {
      navigate(`/${projectId}/${updates.currentPhase}`);
    }
  };

  const savePhaseFeedback = (phase: Phase, feedbackData: { rating: number; comment: string }) => {
    if (!activeProject) return;
    const currentFeedback = activeProject.feedback || {} as Record<Phase, { rating: number; comment: string }>;
    updateProject({
      feedback: {
        ...currentFeedback,
        [phase]: feedbackData
      }
    });
  };

  const saveABTest = (data: Partial<Project['abTests']>) => {
    if (!activeProject) return;
    updateProject({
      abTests: {
        ...(activeProject.abTests || { headlineA: '', headlineB: '' }),
        ...data
      } as Project['abTests']
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const runPhaseAction = async (phase: Phase) => {
    if (!activeProject) return;
    setLoading(true);
    try {
      let result = '';
      if (phase === 'plan') {
        const topic = activeProject.name === 'Naslovno remek-djelo' ? "Kreativna obrazovna serija o GenAI" : activeProject.name;
        result = await geminiService.generatePlan(topic, activeProject.userInputPlan);
        updateProject({ plan: result, currentPhase: 'plan' });
      } else if (phase === 'produce') {
        result = await geminiService.generateProduction(activeProject.plan || '', activeProject.userInputProduce);
        updateProject({ prompts: result, currentPhase: 'produce' });
      } else if (phase === 'edit') {
        result = await geminiService.generateEditingAdvice(
          activeProject.plan || '', 
          activeProject.userInputEdit,
          activeProject.editOptions
        );
        updateProject({ editAdvice: result, currentPhase: 'edit' });
      } else if (phase === 'publish') {
        result = await geminiService.generatePublishing(activeProject.plan || '', activeProject.userInputPublish);
        updateProject({ publishingData: result, currentPhase: 'publish' });
      } else if (phase === 'branding') {
        result = await geminiService.analyzeBranding(activeProject.userInputBranding || 'Nema opisa.');
        updateProject({ brandingAdvice: result, currentPhase: 'branding' });
      } else if (phase === 'avatar') {
        const context = `${activeProject.plan || ''} ${activeProject.brandingAdvice || ''}`;
        result = await geminiService.generateAvatarAdvice(context, activeProject.userInputAvatar);
        updateProject({ avatarAdvice: result, currentPhase: 'avatar' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden font-sans text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sky-100 flex flex-col bg-white/50 backdrop-blur-sm">
        <div className="p-6 border-b border-sky-100">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-pink-600 rounded-lg neon-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">CreatorFlow <span className="text-pink-500">AI</span></h1>
          </div>
          
          <button 
            onClick={startNewProject}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-2.5 rounded-lg font-medium hover:bg-black transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novi projekt
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">Nedavni projekti</div>
          <div className="space-y-1">
            {projects.map(p => (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => navigate(`/${p.id}/${p.currentPhase}`)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-all group border border-transparent flex justify-between items-center",
                    projectId === p.id ? "bg-white border-sky-200 text-pink-600 shadow-sm" : "text-zinc-500 hover:bg-white/50 hover:text-zinc-900"
                  )}
                >
                  <div className="truncate flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-[10px] opacity-50 flex items-center gap-1 mt-0.5 uppercase">
                      {p.currentPhase === 'plan' && <Sparkles className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'produce' && <Video className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'edit' && <Scissors className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'publish' && <Upload className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'branding' && <Fingerprint className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'avatar' && <UserCog className="w-2.5 h-2.5" />}
                      {p.currentPhase === 'plan' ? 'Planiranje' : 
                       p.currentPhase === 'produce' ? 'Produkcija' : 
                       p.currentPhase === 'edit' ? 'Uređivanje' : 
                       p.currentPhase === 'publish' ? 'Objavljivanje' : 
                       p.currentPhase === 'branding' ? 'Brendiranje' : 'AI Avatar'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => deleteProject(e, p.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-pink-500 transition-all rounded-md hover:bg-sky-50"
                  title="Obriši projekt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-zinc-600 text-sm px-2 italic">Još nema projekata...</div>
            )}
          </div>
        </nav>

        <div className="p-6 border-t border-sky-100">
          <div className="glass-panel p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-pink-600 font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              Savjet za kreatore
            </div>
            <p className="text-zinc-500 leading-relaxed">
              AI bi trebao služiti kao inspiracija. Ljudska autentičnost je ključ povjerenja.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeProject ? (
          <>
            {/* Header */}
            <header className="px-8 py-6 border-b border-sky-100 flex justify-between items-center bg-white/70 backdrop-blur-md z-10">
              <div>
                <input 
                  value={activeProject.name}
                  onChange={(e) => updateProject({ name: e.target.value })}
                  className="bg-transparent text-xl font-semibold focus:outline-none border-b border-transparent hover:border-sky-200 transition-colors text-zinc-900"
                />
                <div className="flex items-center gap-4 mt-2">
                  <PhaseTab 
                    active={currentPhase === 'plan'} 
                    icon={<Sparkles className="w-3.5 h-3.5" />} 
                    label="Planiranje" 
                    onClick={() => navigate(`/${projectId}/plan`)}
                  />
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                  <PhaseTab 
                    active={currentPhase === 'produce'} 
                    icon={<Video className="w-3.5 h-3.5" />} 
                    label="Produkcija" 
                    onClick={() => navigate(`/${projectId}/produce`)}
                  />
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                  <PhaseTab 
                    active={currentPhase === 'edit'} 
                    icon={<Scissors className="w-3.5 h-3.5" />} 
                    label="Uređivanje" 
                    onClick={() => navigate(`/${projectId}/edit`)}
                  />
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                  <PhaseTab 
                    active={currentPhase === 'publish'} 
                    icon={<Upload className="w-3.5 h-3.5" />} 
                    label="Objavljivanje" 
                    onClick={() => navigate(`/${projectId}/publish`)}
                  />
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                  <PhaseTab 
                    active={currentPhase === 'branding'} 
                    icon={<Fingerprint className="w-3.5 h-3.5" />} 
                    label="Brendiranje" 
                    onClick={() => navigate(`/${projectId}/branding`)}
                  />
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                  <PhaseTab 
                    active={currentPhase === 'avatar'} 
                    icon={<UserCog className="w-3.5 h-3.5" />} 
                    label="AI Avatar" 
                    onClick={() => navigate(`/${projectId}/avatar`)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={loading}
                  onClick={() => runPhaseAction(currentPhase)}
                  className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium transition-all shadow-lg shadow-pink-900/20 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Pitaj asistenta
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-200/50 via-transparent to-transparent">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  {/* Warning Box */}
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Napomena o transparentnosti:</strong> Uvijek označite sadržaj potpomognut umjetnom inteligencijom na platformama poput TikToka ili YouTubea kako biste izbjegli shadow-banning i zadržali povjerenje.
                    </p>
                  </div>

                  {/* Phase Specific Views */}
                  {currentPhase === 'plan' && (
                    <div className="grid gap-6">
                      <Card title="Vaše ideje za plan">
                        <PhaseInput 
                          value={activeProject.userInputPlan || ''} 
                          onChange={(val) => updateProject({ userInputPlan: val })}
                          placeholder="Upišite svoje misli o temi, publici ili tonu videa..."
                        />
                      </Card>
                      <Card 
                        title="Koncept i strategija" 
                        onCopy={activeProject.plan ? () => handleCopy(activeProject.plan!, 'plan') : undefined}
                        copied={copied === 'plan'}
                      >
                        {!activeProject.plan ? (
                          <div className="py-12 text-center text-zinc-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Opišite svoju ideju iznad i kliknite "Pitaj asistenta" za generiranje plana.</p>
                          </div>
                        ) : (
                          <div className="mt-6 pt-6 border-t border-sky-100">
                            <ContentBox content={activeProject.plan} />
                            <FeedbackSection 
                              phase="plan" 
                              feedback={activeProject.feedback?.plan} 
                              onSave={(fb) => savePhaseFeedback('plan', fb)} 
                            />
                          </div>
                        )}
                      </Card>
                      {activeProject.plan && (
                        <NextStepButton 
                          label="Nastavi na produkciju" 
                          onClick={() => navigate(`/${projectId}/produce`)} 
                        />
                      )}
                    </div>
                  )}

                  {currentPhase === 'produce' && (
                    <div className="grid gap-6">
                      <Card title="Vaši produkcijski zahtjevi">
                        <PhaseInput 
                          value={activeProject.userInputProduce || ''} 
                          onChange={(val) => updateProject({ userInputProduce: val })}
                          placeholder="Imate li specifične zahtjeve za slike ili glasove?"
                        />
                      </Card>
                      <Card 
                        title="Produkcijski vizuali i audio" 
                        onCopy={activeProject.prompts ? () => handleCopy(activeProject.prompts!, 'produce') : undefined}
                        copied={copied === 'produce'}
                      >
                        {!activeProject.prompts ? (
                          <div className="py-12 text-center text-zinc-500">
                            <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Generirajte precizne upute za AI alate za slike i video na temelju vašeg plana.</p>
                          </div>
                        ) : (
                          <div className="mt-6 pt-6 border-t border-sky-100">
                            <ContentBox content={activeProject.prompts} />
                            <FeedbackSection 
                              phase="produce" 
                              feedback={activeProject.feedback?.produce} 
                              onSave={(fb) => savePhaseFeedback('produce', fb)} 
                            />
                          </div>
                        )}
                      </Card>
                      <div className="flex justify-between">
                        <button onClick={() => updateProject({ currentPhase: 'plan' })} className="text-zinc-500 hover:text-zinc-900 text-sm">← Povratak na planiranje</button>
                        {activeProject.prompts && (
                          <NextStepButton 
                            label="Nastavi na uređivanje" 
                            onClick={() => navigate(`/${projectId}/edit`)} 
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {currentPhase === 'edit' && (
                    <div className="grid gap-6">
                      <Card title="Napredne opcije montaže">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Prijelazi</label>
                            <select 
                              value={activeProject.editOptions?.transitions || ''}
                              onChange={(e) => updateProject({ editOptions: { ...(activeProject.editOptions || { transitions: '', effects: '', timestamps: '' }), transitions: e.target.value } })}
                              className="w-full bg-white/50 border border-sky-100 rounded-lg p-2 text-sm focus:outline-none"
                            >
                              <option value="">Nema/Standardno</option>
                              <option value="Smooth Cut">Smooth Cut</option>
                              <option value="Zoom Blur">Zoom Blur</option>
                              <option value="Whip Pan">Whip Pan</option>
                              <option value="Dissolve">Dissolve</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vizualni Efekti</label>
                            <select 
                              value={activeProject.editOptions?.effects || ''}
                              onChange={(e) => updateProject({ editOptions: { ...(activeProject.editOptions || { transitions: '', effects: '', timestamps: '' }), effects: e.target.value } })}
                              className="w-full bg-white/50 border border-sky-100 rounded-lg p-2 text-sm focus:outline-none"
                            >
                              <option value="">Nema/Standardno</option>
                              <option value="Color Grading - Moody">Color Grading - Moody</option>
                              <option value="Film Grain">Film Grain</option>
                              <option value="VHS Aesthetic">VHS Aesthetic</option>
                              <option value="Dynamic Text Overlays">Dynamic Text Overlays</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vremenski Kodovi (Rezovi)</label>
                            <input 
                              type="text"
                              value={activeProject.editOptions?.timestamps || ''}
                              onChange={(e) => updateProject({ editOptions: { ...(activeProject.editOptions || { transitions: '', effects: '', timestamps: '' }), timestamps: e.target.value } })}
                              placeholder="npr. 0:10-0:15, 1:20-1:30"
                              className="w-full bg-white/50 border border-sky-100 rounded-lg p-2 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <PhaseInput 
                          value={activeProject.userInputEdit || ''} 
                          onChange={(val) => updateProject({ userInputEdit: val })}
                          placeholder="Dodatne upute za montažera..."
                        />
                      </Card>
                      <Card 
                        title="Tehnike uređivanja" 
                        onCopy={activeProject.editAdvice ? () => handleCopy(activeProject.editAdvice!, 'edit') : undefined}
                        copied={copied === 'edit'}
                      >
                        {!activeProject.editAdvice ? (
                          <div className="py-12 text-center text-zinc-500">
                            <Scissors className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Dobijte savjete o sinkronizaciji usana, restilizaciji i pretvaranju dugih isječaka u viralne shortsove.</p>
                          </div>
                        ) : (
                          <div className="mt-6 pt-6 border-t border-sky-100">
                            <ContentBox content={activeProject.editAdvice} />
                            <FeedbackSection 
                              phase="edit" 
                              feedback={activeProject.feedback?.edit} 
                              onSave={(fb) => savePhaseFeedback('edit', fb)} 
                            />
                          </div>
                        )}
                      </Card>
                      <div className="flex justify-between">
                        <button onClick={() => updateProject({ currentPhase: 'produce' })} className="text-zinc-500 hover:text-zinc-900 text-sm">← Povratak na produkciju</button>
                        {activeProject.editAdvice && (
                          <NextStepButton 
                            label="Nastavi na objavljivanje" 
                            onClick={() => navigate(`/${projectId}/publish`)} 
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {currentPhase === 'publish' && (
                    <div className="grid gap-6">
                      <Card title="Korisničke napomene za objavu">
                        <PhaseInput 
                          value={activeProject.userInputPublish || ''} 
                          onChange={(val) => updateProject({ userInputPublish: val })}
                          placeholder="Gdje planirate objaviti video? (YouTube, TikTok, Instagram...)"
                        />
                      </Card>
                      <Card 
                        title="Optimizacija za lansiranje" 
                        onCopy={activeProject.publishingData ? () => handleCopy(activeProject.publishingData!, 'publish') : undefined}
                        copied={copied === 'publish'}
                      >
                        {!activeProject.publishingData ? (
                          <div className="py-12 text-center text-zinc-500">
                            <Upload className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Generirajte naslove visoke vidljivosti i vodiče za transkripciju.</p>
                          </div>
                        ) : (
                          <div className="mt-6 pt-6 border-t border-sky-100">
                            <ContentBox content={activeProject.publishingData} />
                            
                            <div className="mt-8 pt-8 border-t border-sky-100">
                              <h4 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-pink-600" />
                                A/B Testiranje Naslova
                              </h4>
                              <p className="text-xs text-zinc-500 mb-6">Usporedite dva naslova kako biste vidjeli koji bolje odražava vašu viziju.</p>
                              
                              <ABTestSection 
                                data={activeProject.abTests}
                                onSave={saveABTest}
                              />
                            </div>

                            <FeedbackSection 
                              phase="publish" 
                              feedback={activeProject.feedback?.publish} 
                              onSave={(fb) => savePhaseFeedback('publish', fb)} 
                            />
                          </div>
                        )}
                      </Card>
                      <div className="flex justify-between">
                        <button onClick={() => updateProject({ currentPhase: 'edit' })} className="text-zinc-500 hover:text-zinc-900 text-sm">← Povratak na uređivanje</button>
                        <NextStepButton 
                          label="Analiziraj moj brending" 
                          onClick={() => navigate(`/${projectId}/branding`)} 
                        />
                      </div>
                    </div>
                  )}

                  {currentPhase === 'branding' && (
                    <div className="grid gap-6">
                      <Card title="Brending Audit">
                        <div className="space-y-4 mb-6">
                          <label className="text-sm font-semibold text-zinc-600 block">Opišite svoj trenutni stil ili zalijepite opise dosadašnjih objava:</label>
                          <PhaseInput 
                            value={activeProject.userInputBranding || ''}
                            onChange={(val) => updateProject({ userInputBranding: val })}
                            placeholder="Npr. Objavljujem tech tutorijale u minimalističkom stilu s plavim akcentima..."
                          />
                        </div>
                        {!activeProject.brandingAdvice ? (
                          <div className="py-8 text-center text-zinc-400">
                            <Fingerprint className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Kliknite "Pitaj asistenta" za analizu i personalizirane savjete.</p>
                          </div>
                        ) : (
                          <div className="mt-6 pt-6 border-t border-sky-100">
                            <ContentBox content={activeProject.brandingAdvice} />
                            <FeedbackSection 
                              phase="branding" 
                              feedback={activeProject.feedback?.branding} 
                              onSave={(fb) => savePhaseFeedback('branding', fb)} 
                            />
                          </div>
                        )}
                      </Card>
                      <div className="flex justify-between">
                        <button onClick={() => updateProject({ currentPhase: 'publish' })} className="text-zinc-500 hover:text-zinc-900 text-sm">← Povratak na objavljivanje</button>
                        <NextStepButton 
                          label="Zamisli moj AI Avatar" 
                          onClick={() => navigate(`/${projectId}/avatar`)} 
                        />
                      </div>
                    </div>
                  )}

                  {currentPhase === 'avatar' && (
                    <motion.div 
                      className="grid gap-6"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.15
                          }
                        }
                      }}
                    >
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                      >
                        <Card title="Vaše želje za avatar">
                          <PhaseInput 
                            value={activeProject.userInputAvatar || ''}
                            onChange={(val) => updateProject({ userInputAvatar: val })}
                            placeholder="Kakve osobine ili izgled želite za svoj digitalni lik?"
                          />
                        </Card>
                      </motion.div>

                      <motion.div 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                      >
                        <Card 
                          title="AI Avatar & Persona" 
                          onCopy={activeProject.avatarAdvice ? () => handleCopy(activeProject.avatarAdvice!, 'avatar') : undefined}
                          copied={copied === 'avatar'}
                        >
                          {!activeProject.avatarAdvice ? (
                            <div className="py-12 text-center text-zinc-500">
                              <motion.div
                                animate={{ 
                                  rotate: [0, -10, 10, -10, 10, 0],
                                  scale: [1, 1.1, 1],
                                  filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <UserCog className="w-16 h-16 mx-auto mb-4 text-pink-400 opacity-40" />
                              </motion.div>
                              <p className="max-w-xs mx-auto text-sm leading-relaxed">
                                Analizirajte plan i brend kako biste stvorili digitalnog predstavnika koji zrači vašom karizmom.
                              </p>
                            </div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, filter: "blur(10px)" }}
                              animate={{ opacity: 1, filter: "blur(0px)" }}
                              transition={{ duration: 0.6 }}
                            >
                              <ContentBox content={activeProject.avatarAdvice} />
                              <FeedbackSection 
                                phase="avatar" 
                                feedback={activeProject.feedback?.avatar} 
                                onSave={(fb) => savePhaseFeedback('avatar', fb)} 
                              />
                            </motion.div>
                          )}
                        </Card>
                      </motion.div>

                      <motion.div 
                        variants={{
                          hidden: { opacity: 0 },
                          show: { opacity: 1 }
                        }}
                        className="flex justify-between"
                      >
                        <button onClick={() => updateProject({ currentPhase: 'branding' })} className="text-zinc-500 hover:text-zinc-900 text-sm flex items-center gap-2 group transition-colors">
                          <span className="group-hover:-translate-x-1 transition-transform">←</span> Povratak na brendiranje
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-200/50 via-transparent to-transparent">
            <div className="max-w-md space-y-6">
              <div className="relative inline-block">
                <div className="p-6 bg-pink-600/10 rounded-3xl border border-pink-500/20 shadow-xl shadow-pink-500/5">
                  <Sparkles className="w-16 h-16 text-pink-600" />
                </div>
                <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full border border-sky-200 shadow-sm">
                  <Plus className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-zinc-900">Započnite svoje kreativno putovanje</h2>
              <p className="text-zinc-600 leading-relaxed">
                Odaberite projekt iz bočne trake ili kliknite "Novi projekt" kako biste započeli planiranje svog sljedećeg viralnog videa uz CreatorFlow AI.
              </p>
              <button 
                onClick={startNewProject}
                className="px-8 py-3 bg-zinc-900 text-white rounded-full font-bold hover:bg-black transition-all flex items-center gap-2 mx-auto shadow-lg shadow-zinc-950/20"
              >
                Pokreni novu ideju
              </button>
              
              <div className="grid grid-cols-2 gap-4 mt-12 text-left">
                <OnboardingCard icon={<Lightbulb />} title="Planiranje" desc="Identifikacija niše i pisanje scenarija." />
                <OnboardingCard icon={<Video />} title="Produkcija" desc="Vizualni upiti i AI glasovi." />
                <OnboardingCard icon={<Scissors />} title="Uređivanje" desc="Sinkronizacija usana i savjeti za restilizaciju." />
                <OnboardingCard icon={<Fingerprint />} title="Brending" desc="Analiza konzistentnosti i audita." />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function PhaseTab({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-pink-600 focus:outline-none",
        active ? "text-pink-600" : "text-zinc-400"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Card({ title, children, onCopy, copied }: { title: string; children: React.ReactNode; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-sky-100 bg-white/30 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-700">{title}</h3>
        <div className="flex items-center gap-3">
          {onCopy && (
            <button 
              onClick={onCopy}
              className="p-1.5 hover:bg-sky-100 rounded-md transition-colors text-zinc-400 hover:text-zinc-700"
              title="Kopiraj u međuspremnik"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sky-200" />
            <div className="w-2 h-2 rounded-full bg-sky-200" />
            <div className="w-2 h-2 rounded-full bg-sky-200" />
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function ContentBox({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none">
      <div className="text-zinc-800 leading-relaxed text-sm bg-white/50 p-6 rounded-xl border border-sky-100">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

function NextStepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full py-4 rounded-xl bg-white border border-sky-200 hover:border-pink-500/50 hover:bg-sky-50 transition-all text-zinc-700 flex items-center justify-center gap-3 font-semibold group shadow-sm"
    >
      {label}
      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-pink-600" />
    </motion.button>
  );
}

function OnboardingCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-sky-100 shadow-sm space-y-1">
      <div className="text-pink-600 mb-2">{icon}</div>
      <div className="font-semibold text-sm text-zinc-800">{title}</div>
      <div className="text-[11px] text-zinc-500">{desc}</div>
    </div>
  );
}

function PhaseInput({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) {
  return (
    <textarea 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-32 bg-white/50 border border-sky-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-pink-500/20 focus:outline-none resize-none transition-all hover:bg-white"
    />
  );
}

function FeedbackSection({ phase, feedback, onSave }: { phase: Phase; feedback?: { rating: number; comment: string }; onSave: (f: { rating: number; comment: string }) => void }) {
  const [rating, setRating] = React.useState(feedback?.rating || 0);
  const [comment, setComment] = React.useState(feedback?.comment || '');

  return (
    <div className="mt-6 pt-6 border-t border-sky-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-zinc-700">Vaša povratna informacija</h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                setRating(star);
                onSave({ rating: star, comment });
              }}
              className={cn(
                "p-1 transition-colors",
                rating >= star ? "text-amber-400" : "text-zinc-200 hover:text-amber-200"
              )}
            >
              <Sparkles className="w-4 h-4 fill-current" />
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => onSave({ rating, comment })}
        placeholder="Što možemo poboljšati u ovoj fazi?"
        className="w-full bg-white/30 border border-sky-50/50 rounded-lg p-3 text-xs focus:ring-1 focus:ring-pink-500/20 focus:outline-none resize-none h-16 transition-all"
      />
    </div>
  );
}

function ABTestSection({ data, onSave }: { data?: Project['abTests']; onSave: (d: Partial<Project['abTests']>) => void }) {
  const headlineA = data?.headlineA || '';
  const headlineB = data?.headlineB || '';
  const winner = data?.winner;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={cn(
        "p-4 rounded-xl border transition-all relative group",
        winner === 'A' ? "bg-green-50 border-green-200 shadow-sm" : "bg-white/50 border-sky-100"
      )}>
        <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex justify-between">
          Naslov A
          {winner === 'A' && <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Pobjednik</span>}
        </div>
        <input 
          value={headlineA}
          onChange={(e) => onSave({ headlineA: e.target.value })}
          placeholder="Unesite naslov A..."
          className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-zinc-300"
        />
        {!winner && headlineA && (
          <button 
            onClick={() => onSave({ winner: 'A' })}
            className="mt-4 text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider"
          >
            Označi kao bolji
          </button>
        )}
      </div>

      <div className={cn(
        "p-4 rounded-xl border transition-all relative group",
        winner === 'B' ? "bg-green-50 border-green-200 shadow-sm" : "bg-white/50 border-sky-100"
      )}>
        <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 flex justify-between">
          Naslov B
          {winner === 'B' && <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Pobjednik</span>}
        </div>
        <input 
          value={headlineB}
          onChange={(e) => onSave({ headlineB: e.target.value })}
          placeholder="Unesite naslov B..."
          className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-zinc-300"
        />
        {!winner && headlineB && (
          <button 
            onClick={() => onSave({ winner: 'B' })}
            className="mt-4 text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider"
          >
            Označi kao bolji
          </button>
        )}
      </div>

      {winner && (
        <div className="col-span-2 text-center mt-2">
          <button 
            onClick={() => onSave({ winner: undefined })}
            className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Poništi izbor pobjednika
          </button>
        </div>
      )}
    </div>
  );
}
