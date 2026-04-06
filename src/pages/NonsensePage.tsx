import { useParams, Link } from 'react-router-dom';
import { Cat, Box, CircleDashed } from 'lucide-react';

export default function NonsensePage() {
  const { id } = useParams();

  const nonsenseContent: Record<string, { title: string, content: React.ReactNode, icon: React.ReactNode }> = {
    'gomitolo': {
      title: 'Il Gomitolo Infinito',
      icon: <CircleDashed className="h-12 w-12 text-indigo-500 mb-4" />,
      content: (
        <div className="space-y-4 text-stone-700">
          <p>Secondo antiche leggende feline, esiste un gomitolo che non finisce mai. Se inizi a srotolarlo il lunedì, arriverai a domenica con ancora più filo di prima.</p>
          <p>Gli scienziati di MicioOS hanno cercato di calcolare la lunghezza di questo gomitolo, ma i server si sono distratti a guardare un laser rosso sul muro.</p>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 italic">
            "Miao miao miao mrrr... prrrr." - Filosofo Gatto Anonimo
          </div>
        </div>
      )
    },
    'scatola': {
      title: 'Teoria della Scatola Vuota',
      icon: <Box className="h-12 w-12 text-amber-500 mb-4" />,
      content: (
        <div className="space-y-4 text-stone-700">
          <p>La Teoria della Scatola Vuota afferma che: <strong>"Se esiste una scatola, un gatto ci entrerà, indipendentemente dalle leggi della fisica."</strong></p>
          <p>Non importa se la scatola è grande quanto un pacchetto di fiammiferi e il gatto pesa 8 kg. Il gatto diventerà liquido e ci entrerà.</p>
          <p>Questa è la base dell'architettura di SaturnixOS: il sistema operativo si adatta allo spazio disponibile, anche se non ha senso.</p>
        </div>
      )
    },
    'croccantini': {
      title: 'Croccantini Quantistici',
      icon: <Cat className="h-12 w-12 text-emerald-500 mb-4" />,
      content: (
        <div className="space-y-4 text-stone-700">
          <p>La ciotola è contemporaneamente mezza piena e mezza vuota. Tuttavia, per il gatto, se si vede il fondo della ciotola, essa è <strong>assolutamente e tragicamente vuota</strong>.</p>
          <p>Il gatto inizierà a miagolare disperatamente alle 4 del mattino per avvisare l'umano di questa anomalia quantistica.</p>
          <p>Aggiungere un singolo croccantino ripristina l'equilibrio dell'universo.</p>
        </div>
      )
    }
  };

  const page = id && nonsenseContent[id] ? nonsenseContent[id] : {
    title: 'Pagina Non Trovata (O Mangiata dal Cane)',
    icon: <Cat className="h-12 w-12 text-red-500 mb-4" />,
    content: <p>Questa pagina nonsense non esiste. Forse l'ha cancellata MiciaOS per fare spazio a foto di topi.</p>
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 text-center">
        <div className="flex justify-center">
          {page.icon}
        </div>
        <h1 className="text-4xl font-serif font-bold text-indigo-900 mb-6">{page.title}</h1>
        <div className="text-left text-lg leading-relaxed">
          {page.content}
        </div>
        <div className="mt-12 pt-6 border-t border-stone-100">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
            &larr; Torna alla cuccia (Home)
          </Link>
        </div>
      </div>
    </div>
  );
}
