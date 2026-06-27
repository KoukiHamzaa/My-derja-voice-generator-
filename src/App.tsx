import React from 'react';
import { Sparkles, Mic, Headphones, Volume2, Globe } from 'lucide-react';
import VoiceoverStudio from './components/VoiceoverStudio';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30 selection:text-amber-400">
      {/* Background Soft Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-1/4 w-[400px] h-[400px] bg-yellow-500/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative top border */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

      {/* Primary Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Sleek App Header */}
        <header id="main-studio-header" className="border-b border-neutral-900 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Mic className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-500 font-sans">
                TounsiVoice <span className="text-neutral-100">Studio</span>
              </h1>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-500/20 tracking-wider uppercase font-mono">
                Tunisian Derja Edition
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Generate realistic, warm, and natural conversational voiceovers in the Tunisian Arabic dialect (الدارجة التونسية). 
              Crafted specifically to sound like a native Tunisian speaker with correct cadence and fluid local pacing.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3.5 flex items-center gap-2 text-xs font-mono">
              <Globe className="w-4 h-4 text-amber-500" />
              <span className="text-neutral-400">Dialect:</span>
              <span className="text-neutral-200 font-bold">Tunisian (Tounsi)</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-3.5 flex items-center gap-2 text-xs font-mono">
              <Headphones className="w-4 h-4 text-amber-500" />
              <span className="text-neutral-400">Engine:</span>
              <span className="text-neutral-200 font-bold">Gemini 3.1 TTS</span>
            </div>
          </div>
        </header>

        {/* Master Studio Component */}
        <main className="mb-12">
          <VoiceoverStudio />
        </main>

        {/* Informative Footer */}
        <footer className="border-t border-neutral-900 pt-6 text-center text-xs text-neutral-500 space-y-2">
          <p>© {new Date().getFullYear()} TounsiVoice Studio • Premium Tunisian Speech Synthesizer.</p>
          <div className="flex justify-center items-center gap-2.5">
            <span>Powered by Gemini 3.1 Flash Text-to-Speech API</span>
            <span>•</span>
            <span className="text-amber-500/80">Warm, conversational local delivery</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
