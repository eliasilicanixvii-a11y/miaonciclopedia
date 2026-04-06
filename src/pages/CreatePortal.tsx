import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { PortalConfig, DEFAULT_PORTALS } from '../portalsConfig';
import { Save, X, PlusCircle } from 'lucide-react';

export default function CreatePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Cat');
  const [color, setColor] = useState('bg-indigo-900');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name.trim() || !description.trim()) {
      setError("Nome e descrizione sono obbligatori.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const slug = generateSlug(name);
      
      const newPortal: PortalConfig = {
        slug,
        name: name.trim(),
        description: description.trim(),
        iconName,
        color
      };

      const docRef = doc(db, 'settings', 'portals');
      const docSnap = await getDoc(docRef);
      
      let currentPortals = DEFAULT_PORTALS;
      if (docSnap.exists() && docSnap.data().list) {
        currentPortals = docSnap.data().list;
      }

      // Check if slug already exists
      if (currentPortals.some(p => p.slug === slug)) {
        setError("Un portale con questo nome esiste già.");
        setLoading(false);
        return;
      }

      const updatedPortals = [...currentPortals, newPortal];
      
      await setDoc(docRef, { list: updatedPortals }, { merge: true });
      
      navigate(`/portal/${slug}`);
    } catch (err) {
      console.error("Errore durante la creazione del portale:", err);
      setError("Errore durante la creazione del portale.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">Accesso Negato</h1>
        <p className="text-stone-600">Devi essere loggato per creare un portale.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-indigo-600" />
          Crea un Nuovo Portale
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors font-medium text-sm"
        >
          <X className="h-4 w-4" /> Annulla
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
            Nome del Portale
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-serif"
            placeholder="Es: Gatti Spaziali"
            required
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">
            Descrizione
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="Una breve descrizione del portale..."
            required
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="iconName" className="block text-sm font-medium text-stone-700 mb-1">
              Icona
            </label>
            <select
              id="iconName"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="Cat">Gatto (Cat)</option>
              <option value="Fish">Pesce (Fish)</option>
              <option value="Zap">Fulmine (Zap)</option>
              <option value="Star">Stella (Star)</option>
              <option value="FileText">Documento (FileText)</option>
              <option value="ShieldAlert">Scudo (ShieldAlert)</option>
              <option value="Coffee">Caffè (Coffee)</option>
            </select>
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-stone-700 mb-1">
              Colore Tema
            </label>
            <select
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="bg-indigo-900">Indaco Scuro</option>
              <option value="bg-emerald-800">Smeraldo</option>
              <option value="bg-amber-700">Ambra</option>
              <option value="bg-rose-800">Rosa Scuro</option>
              <option value="bg-slate-800">Ardesia</option>
              <option value="bg-red-900">Rosso Scuro</option>
              <option value="bg-orange-800">Arancione</option>
              <option value="bg-fuchsia-900">Fucsia</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            {loading ? 'Creazione...' : 'Crea Portale'}
          </button>
        </div>
      </form>
    </div>
  );
}
