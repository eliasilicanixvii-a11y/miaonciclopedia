import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, Database, Plus, Trash2 } from 'lucide-react';
import { seedArticles } from '../seed';
import { fetchPortals, PortalConfig, DEFAULT_PORTALS } from '../portalsConfig';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sapeviChe, setSapeviChe] = useState('"I gatti non dormono, vanno in standby per ricaricare i loro sensori di complotti globali."');
  const [recordGiorno, setRecordGiorno] = useState('Il gatto di Azuro ha dormito per 26 ore di fila su una tastiera.');
  const [portals, setPortals] = useState<PortalConfig[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'sidebar');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.sapeviChe) setSapeviChe(data.sapeviChe);
          if (data.recordGiorno) setRecordGiorno(data.recordGiorno);
        }

        const fetchedPortals = await fetchPortals();
        setPortals(fetchedPortals);
      } catch (err) {
        console.error("Errore nel caricamento delle impostazioni:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'settings', 'sidebar'), {
        sapeviChe,
        recordGiorno,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await setDoc(doc(db, 'settings', 'portals'), {
        list: portals,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setMessage('Impostazioni salvate con successo! Miao!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      setMessage('Errore durante il salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    setMessage('');
    try {
      await seedArticles();
      setMessage('Articoli di base generati con successo!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Errore durante la generazione degli articoli:", err);
      setMessage('Errore durante la generazione degli articoli.');
    } finally {
      setSeeding(false);
    }
  };

  const addPortal = () => {
    setPortals([...portals, {
      slug: 'nuovo-portale',
      name: 'Nuovo Portale',
      color: 'bg-indigo-900',
      iconName: 'Cat',
      description: 'Descrizione del nuovo portale'
    }]);
  };

  const removePortal = (index: number) => {
    const newPortals = [...portals];
    newPortals.splice(index, 1);
    setPortals(newPortals);
  };

  const updatePortal = (index: number, field: keyof PortalConfig, value: string) => {
    const newPortals = [...portals];
    newPortals[index] = { ...newPortals[index], [field]: value };
    
    // Auto-update slug if name changes and slug hasn't been manually edited much
    if (field === 'name' && newPortals[index].slug === 'nuovo-portale') {
      newPortals[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    setPortals(newPortals);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
          Pannello di Controllo Felino
        </h1>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.includes('Errore') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <AlertCircle className="h-5 w-5" />
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-stone-800 border-b border-stone-200 pb-2">Impostazioni Sidebar</h2>
            <div>
              <label htmlFor="sapeviChe" className="block text-sm font-medium text-stone-700 mb-2">
                Lo sapevi che...
              </label>
              <textarea
                id="sapeviChe"
                value={sapeviChe}
                onChange={(e) => setSapeviChe(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="recordGiorno" className="block text-sm font-medium text-stone-700 mb-2">
                Record del giorno
              </label>
              <textarea
                id="recordGiorno"
                value={recordGiorno}
                onChange={(e) => setRecordGiorno(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xl font-serif font-bold text-stone-800">Gestione Portali</h2>
              <button
                type="button"
                onClick={addPortal}
                className="flex items-center gap-1 text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Plus className="h-4 w-4" /> Aggiungi Portale
              </button>
            </div>
            
            <div className="space-y-4">
              {portals.map((portal, index) => (
                <div key={index} className="p-4 border border-stone-200 rounded-xl bg-stone-50 relative">
                  <button
                    type="button"
                    onClick={() => removePortal(index)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
                      <input
                        type="text"
                        value={portal.name}
                        onChange={(e) => updatePortal(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Slug (URL)</label>
                      <input
                        type="text"
                        value={portal.slug}
                        onChange={(e) => updatePortal(index, 'slug', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Colore (es. bg-indigo-900)</label>
                      <input
                        type="text"
                        value={portal.color}
                        onChange={(e) => updatePortal(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Icona (es. Cat, Star, Fish)</label>
                      <input
                        type="text"
                        value={portal.iconName}
                        onChange={(e) => updatePortal(index, 'iconName', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-stone-500 mb-1">Descrizione</label>
                      <input
                        type="text"
                        value={portal.description}
                        onChange={(e) => updatePortal(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="h-5 w-5" />
              )}
              Salva Impostazioni
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">
          Azioni di Sistema
        </h2>
        <p className="text-stone-600 mb-6">
          Genera gli articoli di base (Razze Feline, Alimentazione, Linguaggio del Corpo, Mr. Bean, Garfield) se non esistono già nel database.
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-900 transition-colors disabled:opacity-50"
        >
          {seeding ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Database className="h-5 w-5" />
          )}
          Genera Articoli di Base
        </button>
      </div>
    </div>
  );
}
