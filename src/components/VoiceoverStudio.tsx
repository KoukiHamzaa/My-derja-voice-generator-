import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Sparkles, Check, Info, AlertCircle, RefreshCw, 
  User, UserCheck, CheckCircle2, ChevronRight, HelpCircle, Flame, ArrowRight
} from 'lucide-react';
import { VoiceProfile, VoiceoverSettings, GeneratedVoiceover } from '../types';
import { pcmToWav, estimateDuration, highlightTunisianDialect } from '../utils/audio';
import AudioPlayer from './AudioPlayer';

const PRESETS: Record<string, string> = {
  default: `السهرية مع عشيرك لازمتها حاجة تحليها
لعبة تخليكم تضحكو وتعملو جو ، وتزيد تقربكم من بعضكم اكثر 
===
المنتج هذا هو الحل 
====
لعبة اللودو المشهورة جات بين يديك باش تكسر الروتين الي 
عايش فيه
 
لعبة تنجموا تلعبوها حتى 4 مبعضكم تتلموا علاها في سهرية 
لصغار و للكبار زادة 

وحتى صغارك تاو معادش باش يخرجوا البرة و معادش باش 
يقلقوك بالحس متاحهم 
واكثر من هكا 
 انت تاو باش تضحك مع عائلتك و تتفرهد معاهم
وبالطبيعة "قِطعْ" لودو يقعدوا fix كان ما انت تحركهم 
و خفيف تنجم تهزوا معاك وين ما انت و سهل تخزين
===
 يعني كي تكمل تلعب 
تخباها بسهولة
=== 
مالا فاش تستنى عدي معانا كوموند تاو و اختار العرض المناسب ليك  و تمتع بالتوصيل في 24 ساعة أكاهاو 
كمية محدودة`
};

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    description: 'Soft, warm, and professional. Excellent for native marketing & friendly local ads.',
    badge: 'Warm & Professional',
    avatarSeed: 'Kore',
    recommendedTone: 'warm and natural'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    description: 'Gentle, modern, and highly fluid. Captures the casual rhythm of young Tunisians.',
    badge: 'Soft & Conversational',
    avatarSeed: 'Zephyr',
    recommendedTone: 'friendly and upbeat'
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    description: 'Cheerful, highly engaging, and fast-paced. Perfect for high-energy Tunisian ads.',
    badge: 'Dynamic & Friendly',
    avatarSeed: 'Puck',
    recommendedTone: 'energetic and positive'
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    description: 'Deep, resonant, and slow-paced. Ideal for narratives and premium product catalogs.',
    badge: 'Deep & Trustworthy',
    avatarSeed: 'Charon',
    recommendedTone: 'warm and reassuring'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    description: 'Commanding, clear, and highly articulate. Excellent for formal explanations in Derja.',
    badge: 'Commanding & Clear',
    avatarSeed: 'Fenrir',
    recommendedTone: 'clear and articulate'
  }
];

const TONE_OPTIONS = [
  { value: 'warm and natural', label: 'Warm & Natural (الدفء والتلقائية)' },
  { value: 'energetic and positive', label: 'Energetic & Cheerful (الحماس والنشاط)' },
  { value: 'calm and professional', label: 'Calm & Professional (الهدوء والمهنية)' },
  { value: 'friendly and upbeat', label: 'Friendly & Inviting (الود والمحبة)' },
  { value: 'clear and articulate', label: 'Clear & Expressive (الوضوح التام)' }
];

const GENERATION_STEPS = [
  "Analyzing Tunisian dialect (Derja) vocabulary...",
  "Proofreading Tunisian phonetics & conversational cadence...",
  "Adjusting vocal tone to sound warm and fully native...",
  "Generating 24kHz premium PCM vocal stream...",
  "Wrapping audio container into playable WAV format..."
];

export default function VoiceoverStudio() {
  const [script, setScript] = useState(PRESETS.default);
  const [gender, setGender] = useState<'female' | 'male'>('female'); // female by default as requested
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [tone, setTone] = useState<string>('warm and natural');
  
  // Interactive Confirmation Flow state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedGender, setConfirmedGender] = useState<'female' | 'male'>('female');
  
  // Audio state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [activeVoiceover, setActiveVoiceover] = useState<GeneratedVoiceover | null>(null);

  // Auto-sync selected voice when gender changes
  useEffect(() => {
    const firstOfGender = VOICE_PROFILES.find(v => v.gender === gender);
    if (firstOfGender && !VOICE_PROFILES.find(v => v.id === selectedVoice && v.gender === gender)) {
      setSelectedVoice(firstOfGender.id);
      setTone(firstOfGender.recommendedTone);
    }
  }, [gender]);

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    const profile = VOICE_PROFILES.find(v => v.id === voiceId);
    if (profile) {
      setTone(profile.recommendedTone);
    }
  };

  const handleTriggerGeneration = async () => {
    setError(null);
    setIsGenerating(true);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= GENERATION_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    try {
      const response = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          voiceName: selectedVoice,
          tone: tone
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError({
          message: data.error || "Failed to generate audio stream from server",
          suggestion: data.suggestion
        });
        return;
      }

      // Convert PCM to standard playable WAV blob
      const wavBlob = pcmToWav(data.audio);
      const audioUrl = URL.createObjectURL(wavBlob);

      setActiveVoiceover({
        audioUrl: audioUrl,
        rawBase64: data.audio,
        voiceName: data.voiceUsed,
        gender: gender,
        tone: data.toneUsed,
        text: script,
        duration: estimateDuration(script),
        createdAt: new Date().toLocaleTimeString()
      });

    } catch (err: any) {
      console.error("Voiceover production error:", err);
      setError({
        message: err.message || "An unexpected error occurred during audio generation. Please try again."
      });
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // The custom confirm delivery action as requested by the user:
  // "After generating the voice, ask me if I need a male or female voiceover so I can confirm. Then finalize and deliver the audio accordingly."
  const openConfirmAndDeliver = () => {
    setConfirmedGender(gender); // sync current
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    setShowConfirmModal(false);
    // If the user changed gender on the final confirmation, we adjust and re-trigger generation!
    if (confirmedGender !== gender) {
      setGender(confirmedGender);
      // Wait for React state to update or directly override selected voice for immediate generation
      const idealVoice = VOICE_PROFILES.find(v => v.gender === confirmedGender)?.id || 'Kore';
      setSelectedVoice(idealVoice);
      
      // We schedule generation directly
      setTimeout(() => {
        handleTriggerGeneration();
      }, 50);
    } else {
      // Just generate with currently selected settings
      handleTriggerGeneration();
    }
  };

  const wordCount = script.trim().split(/\s+/).filter(w => w.length > 0).length;
  const dialectSegments = highlightTunisianDialect(script);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Script Editor Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-neutral-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              Tunisian Arabic Script Editor
            </h3>
            <button 
              onClick={() => {
                setScript(PRESETS.default);
                setError(null);
              }}
              title="Reset default promotional script"
              className="text-xs text-neutral-400 hover:text-amber-500 transition flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Original Script
            </button>
          </div>

          <div className="relative">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="اكتب النص التونسي هنا..."
              dir="rtl"
              className="w-full h-80 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-5 text-neutral-200 text-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
            />
            {/* Live stats */}
            <div className="absolute bottom-3 left-4 flex items-center gap-4 text-xs font-mono text-neutral-400 bg-neutral-900/95 py-1 px-3 rounded-md border border-neutral-800/85">
              <span>{script.length} Characters</span>
              <span>•</span>
              <span>{wordCount} Words</span>
              <span>•</span>
              <span className="text-amber-400">~{estimateDuration(script)}s Est. Duration</span>
            </div>
          </div>

          {/* Dialect Highlights Map */}
          <div className="mt-4 bg-neutral-950/50 rounded-xl p-4 border border-neutral-800/60">
            <h4 className="text-xs font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">
              Tunisian Dialect Word Analysis (Tounsi/Derja)
            </h4>
            <div className="flex flex-wrap gap-1 leading-relaxed text-sm p-2 rounded-lg bg-neutral-950" dir="rtl">
              {dialectSegments.map((seg, idx) => (
                <span 
                  key={idx} 
                  className={seg.isDialect ? "bg-amber-500/10 text-amber-400 font-medium px-1 rounded border border-amber-500/20" : "text-neutral-300"}
                >
                  {seg.word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Profiles & Settings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-md font-bold text-neutral-100 flex items-center gap-2">
            Voice Settings
          </h3>

          {/* Gender Select */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
              Vocal Gender
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 transition font-medium text-sm cursor-pointer ${
                  gender === 'female'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${gender === 'female' ? 'bg-amber-400 animate-ping' : 'bg-transparent'}`} />
                Female Voiceover (Selected)
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 transition font-medium text-sm cursor-pointer ${
                  gender === 'male'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${gender === 'male' ? 'bg-amber-400 animate-ping' : 'bg-transparent'}`} />
                Male Voiceover
              </button>
            </div>
          </div>

          {/* Voice Profile List */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 font-mono">
              Select Voice Actor Profile
            </label>
            <div className="space-y-2.5">
              {VOICE_PROFILES.filter(v => v.gender === gender).map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleVoiceChange(profile.id)}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                    selectedVoice === profile.id
                      ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/5'
                      : 'bg-neutral-950/40 border-neutral-800/80 hover:bg-neutral-950 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                    selectedVoice === profile.id
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {profile.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold text-sm ${
                        selectedVoice === profile.id ? 'text-amber-400' : 'text-neutral-200'
                      }`}>
                        {profile.name} (Native Tounsi)
                      </span>
                      <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded font-mono">
                        {profile.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {profile.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-center self-center h-full">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedVoice === profile.id ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-700'
                    }`}>
                      {selectedVoice === profile.id && <Check className="w-3 h-3 text-amber-500 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
              Vocal Tone & Emotion
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 py-3 px-4 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-sm transition"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Production Studio / Live Delivery Column */}
      <div className="lg:col-span-5 space-y-6">
        {/* Render interactive delivery panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          {/* Subtle lighting overlay */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
          
          <h3 className="text-md font-bold text-neutral-100 flex items-center gap-2 mb-4">
            <Mic className="w-4 h-4 text-amber-500" />
            Audio Production Studio
          </h3>

          <div className="space-y-6">
            {/* Script parameters info */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">
                Current Studio Configuration
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-900 p-2 rounded border border-neutral-800/80">
                  <span className="text-neutral-500 block mb-0.5">Voice Gender</span>
                  <span className="text-neutral-200 capitalize font-medium">{gender} Voice</span>
                </div>
                <div className="bg-neutral-900 p-2 rounded border border-neutral-800/80">
                  <span className="text-neutral-500 block mb-0.5">Voice Actor</span>
                  <span className="text-amber-400 font-medium">{selectedVoice}</span>
                </div>
                <div className="bg-neutral-900 p-2 rounded border border-neutral-800/80">
                  <span className="text-neutral-500 block mb-0.5">Cadence / Dialect</span>
                  <span className="text-neutral-200 font-medium">Tunisian Arabic (Tounsi)</span>
                </div>
                <div className="bg-neutral-900 p-2 rounded border border-neutral-800/80">
                  <span className="text-neutral-500 block mb-0.5">Estimated Length</span>
                  <span className="text-neutral-200 font-medium">~{estimateDuration(script)}s</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4.5 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-red-300">Production Notice / Error</h4>
                  <p className="text-xs text-red-400/90 leading-relaxed">{error.message}</p>
                  {error.suggestion && (
                    <div className="mt-2.5 p-3 bg-neutral-950/80 rounded-lg border border-neutral-800 text-xs text-neutral-300 leading-relaxed space-y-2">
                      <p className="font-medium text-amber-400">💡 Suggested Actions:</p>
                      <p>{error.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trigger Button - Step 1: Open Confirmation Wizard */}
            {!isGenerating && (
              <button
                onClick={openConfirmAndDeliver}
                id="generate-voiceover-btn"
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/15 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-5 h-5 fill-current" />
                Produce & Finalize Voiceover
              </button>
            )}

            {/* Animated Loading rendering state */}
            {isGenerating && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-200">Generating Tunisian Voiceover...</h4>
                  <p className="text-xs text-amber-500 font-mono animate-pulse">
                    {GENERATION_STEPS[generationStep] || "Processing..."}
                  </p>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="bg-amber-500 h-full rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(generationStep + 1) * 20}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deliver Playback Area */}
        <AnimatePresence mode="wait">
          {activeVoiceover ? (
            <motion.div
              key="player-active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AudioPlayer voiceover={activeVoiceover} />
            </motion.div>
          ) : (
            <motion.div
              key="player-empty"
              className="bg-neutral-900/40 border border-neutral-800 border-dashed rounded-2xl p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Mic className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-neutral-400">No Audio Generated Yet</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Set your script, select your favorite native Tunisian voice actor, and click the finalize button above to generate.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DELIVERY GENDER CONFIRMATION DIALOGUE (THE WIZARD) */}
      {/* "After generating the voice, ask me if I need a male or female voiceover so I can confirm." */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="text-neutral-500 hover:text-neutral-300 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                  <UserCheck className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-100">Confirm Voiceover Gender</h3>
                <p className="text-xs text-neutral-400 mt-1.5">
                  Confirm the target voiceover gender before we finalize rendering the high-fidelity Tunisian Arabic audio stream.
                </p>
              </div>

              {/* Toggle Choices */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setConfirmedGender('female')}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    confirmedGender === 'female'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      confirmedGender === 'female' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800'
                    }`}>
                      KO
                    </div>
                    <div>
                      <span className="font-semibold block text-sm">Female Voiceover (Recommended)</span>
                      <span className="text-xs text-neutral-500">Perfect for the requested Tunisian script</span>
                    </div>
                  </div>
                  {confirmedGender === 'female' && <CheckCircle2 className="w-5 h-5 text-amber-400 fill-current text-neutral-900" />}
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmedGender('male')}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    confirmedGender === 'male'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      confirmedGender === 'male' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800'
                    }`}>
                      PU
                    </div>
                    <div>
                      <span className="font-semibold block text-sm">Male Voiceover</span>
                      <span className="text-xs text-neutral-500">Alternative voice with strong rhythmic Derja flow</span>
                    </div>
                  </div>
                  {confirmedGender === 'male' && <CheckCircle2 className="w-5 h-5 text-amber-400 fill-current text-neutral-900" />}
                </button>
              </div>

              {/* Guidelines checklist */}
              <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 text-[11px] text-neutral-400 space-y-2 mb-6">
                <div className="flex gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Exact word-for-word delivery matching the Tunisian script.</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Warm, fluid native Tunisian Arabic dialect (no standard Fusha).</span>
                </div>
                <div className="flex gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>WAV master file export in 24kHz.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirm}
                  id="final-confirm-btn"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  Render & Deliver
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
