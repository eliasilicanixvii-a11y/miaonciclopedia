import { useState } from 'react';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';

const subjects = [
  "Mark Zuckerberg", "Elon Musk", "Il tuo gatto", "Un cane sotto copertura", 
  "Bill Gates", "Il CEO di Croccantini SpA", "Gordon Ramsay", "Amadeus",
  "Il creatore di MicioOS", "Un pinguino di Linux", "Miaonciclopedia AI"
];

const actions = [
  "scoperto a mangiare erba gatta di contrabbando", 
  "lancia il nuovo MicioOS 12 con supporto per i grattini", 
  "ammette di essere un rettiliano-felino", 
  "compra SaturnixOS per 2 scatolette di tonno", 
  "bannato da MiciaOS per aver abbaiato",
  "sorpreso a rubare i croccantini del vicino",
  "fonda una startup per tradurre i miagolii in codice C++"
];

const contexts = [
  "durante un'intervista esclusiva.", 
  "in diretta streaming su Twitch.", 
  "mentre si grattava dietro l'orecchio.", 
  "al congresso mondiale dei felini.", 
  "nella sua villa a Beverly Hills.",
  "mentre cercava di installare i driver della lettiera."
];

export default function IdeaGenerator() {
  const [idea, setIdea] = useState("");

  const generateIdea = () => {
    const s = subjects[Math.floor(Math.random() * subjects.length)];
    const a = actions[Math.floor(Math.random() * actions.length)];
    const c = contexts[Math.floor(Math.random() * contexts.length)];
    setIdea(`${s} ${a} ${c}`);
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
        <Sparkles className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-3xl font-serif font-bold text-indigo-900 mb-4">Generatore di Gomitoli (Idee)</h1>
        <p className="text-indigo-700 mb-8">A corto di idee per Miaonciclopedia? Lascia che il nostro algoritmo felino (basato su erba gatta) ti suggerisca uno spunto VIP o tech!</p>
        
        <div className="min-h-[120px] flex items-center justify-center bg-white rounded-2xl p-6 border border-indigo-200 mb-8 shadow-inner">
          {idea ? (
            <p className="text-2xl font-serif font-medium text-stone-800 italic">"{idea}"</p>
          ) : (
            <p className="text-stone-400">Clicca il bottone per generare un'idea...</p>
          )}
        </div>

        <button
          onClick={generateIdea}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-all hover:scale-105 shadow-md"
        >
          <RefreshCw className={`h-5 w-5 ${idea ? 'animate-spin-once' : ''}`} />
          Genera Idea
        </button>
      </div>
    </div>
  );
}
