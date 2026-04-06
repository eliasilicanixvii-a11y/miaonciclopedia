import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Heart, Clock, User as UserIcon, Scissors, Trophy } from 'lucide-react';
import { fetchPortals, getIconComponent, PortalConfig } from '../portalsConfig';
import { seedArticles } from '../seed';
import { useAuth } from '../AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [sapeviChe, setSapeviChe] = useState('"I gatti non dormono, vanno in standby per ricaricare i loro sensori di complotti globali."');
  const [recordGiorno, setRecordGiorno] = useState('Il gatto di Azuro ha dormito per 26 ore di fila su una tastiera.');
  const [portals, setPortals] = useState<PortalConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auto-seed to ensure Mr. Bean and Garfield exist
        if (user && user.role === 'admin') {
          try {
            await seedArticles();
          } catch (e) {
            console.error("Auto-seed failed:", e);
          }
        }

        // Fetch portals
        const fetchedPortals = await fetchPortals();
        setPortals(fetchedPortals);

        // Fetch recent
        const recentQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentArticles(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));

        // Fetch popular
        const popularQuery = query(collection(db, 'articles'), orderBy('purrsCount', 'desc'), limit(5));
        const popularSnap = await getDocs(popularQuery);
        setPopularArticles(popularSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));

        // Fetch settings
        const docRef = doc(db, 'settings', 'sidebar');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.sapeviChe) setSapeviChe(data.sapeviChe);
          if (data.recordGiorno) setRecordGiorno(data.recordGiorno);
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero / Welcome */}
      <section className="text-center bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
        <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-indigo-900 mb-4">
          Benvenuto su Miaonciclopedia
        </h1>
        <p className="text-lg text-indigo-700 max-w-2xl mx-auto">
          L'enciclopedia (un po') libera. La casa ufficiale di tutto ciò che riguarda il mondo felino.
        </p>
      </section>

      {/* Portals Section */}
      <section>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 border-b border-stone-200 pb-2">
          Esplora i Portali
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {portals.slice(0, 8).map(portal => {
            const Icon = getIconComponent(portal.iconName);
            return (
              <Link key={portal.slug} to={`/portal/${portal.slug}`} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 hover:border-indigo-300 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center">
                <Icon className="h-8 w-8 mb-2 text-stone-700 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                <h3 className="font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">{portal.name}</h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Info Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-100 h-full">
          <h3 className="font-serif font-bold text-lg mb-2 text-amber-900">Sapevi che...</h3>
          <p className="text-sm text-amber-800 italic">
            {sapeviChe}
          </p>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl shadow-sm border border-emerald-100 h-full">
          <h3 className="font-serif font-bold text-lg mb-2 text-emerald-900 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Record del giorno
          </h3>
          <p className="text-sm text-emerald-800 font-medium">
            {recordGiorno}
          </p>
        </div>

        <div className="bg-rose-50 p-5 rounded-2xl shadow-sm border border-rose-100 h-full">
          <h3 className="font-serif font-bold text-lg mb-3 text-rose-900 flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Dove posso graffiare?
          </h3>
          <div className="space-y-3 text-sm text-rose-800">
            <p>
              <strong>Vuoi affilarti?</strong> Segui le regole del niente, o dona 100€ per farti i grattini sul mento.
            </p>
            <p>
              <strong>Ti prudono le mani?</strong> Partecipa al box bimbini o prenota una gita scolastica alla casa di Azuro perché lui ha nove miliardi di euro.
            </p>
            <p>
              <strong>Vuoi volare?</strong> Sii un concorrente di Platino club, così se un gatto vede un umano tirare da fuori un oggetto dentro la scatola di cartone, dice "Oh, guarda! Ci è entrato dentro!"
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Articles */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-200 pb-2">
            <Clock className="text-indigo-600 h-6 w-6" />
            Ultimi Graffi (Articoli)
          </h2>
          <div className="space-y-4">
            {recentArticles.length === 0 ? (
              <p className="text-stone-500 italic">Nessun articolo ancora. Sii il primo gatto a scrivere!</p>
            ) : (
              recentArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))
            )}
          </div>
        </section>

        {/* Popular Articles */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-200 pb-2">
            <Heart className="text-red-500 h-6 w-6" />
            I più Fusa-ti (Popolari)
          </h2>
          <div className="space-y-4">
            {popularArticles.length === 0 ? (
              <p className="text-stone-500 italic">Nessun articolo popolare.</p>
            ) : (
              popularArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link 
      to={`/article/${article.slug}`}
      className="block p-5 bg-white border border-stone-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <h3 className="text-lg font-bold text-indigo-900 group-hover:text-indigo-600 mb-2">
        {article.title}
      </h3>
      <p className="text-stone-600 text-sm line-clamp-2 mb-4">
        {article.content.replace(/[#*_\[\]]/g, '').substring(0, 150)}...
      </p>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            {article.authorName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(article.createdAt), 'dd MMM yyyy', { locale: it })}
          </span>
        </div>
        <span className="flex items-center gap-1 font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
          <Heart className="h-3 w-3 fill-current" />
          {article.purrsCount} Fusa
        </span>
      </div>
    </Link>
  );
}
