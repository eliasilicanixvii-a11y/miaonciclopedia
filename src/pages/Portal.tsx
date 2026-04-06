import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { Cat, FileText, Calendar, User } from 'lucide-react';
import { fetchPortals, getIconComponent, PortalConfig } from '../portalsConfig';

export default function Portal() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalInfo, setPortalInfo] = useState<PortalConfig | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const portals = await fetchPortals();
        const config = portals.find(p => p.slug === categorySlug) || {
          slug: categorySlug || '',
          name: categorySlug?.replace(/-/g, ' ') || '',
          color: 'bg-indigo-900',
          iconName: 'Cat',
          description: `Benvenuto nel portale dedicato a "${categorySlug?.replace(/-/g, ' ')}".`
        };
            
        setPortalInfo(config);

        const articlesRef = collection(db, 'articles');
        const q = query(
          articlesRef, 
          where('category', '==', config.name)
        );
        
        const snapshot = await getDocs(q);
        const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        // Sort client-side to avoid needing a composite index immediately
        fetchedArticles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching portal articles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchArticles();
    }
  }, [categorySlug]);

  if (loading || !portalInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const PortalIcon = getIconComponent(portalInfo.iconName);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className={`${portalInfo.color} text-white p-8 rounded-2xl shadow-sm relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <PortalIcon className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-serif font-bold mb-4 flex items-center gap-3">
            Portale: {portalInfo.name}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            {portalInfo.description}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Articoli in questo portale
        </h2>

        {articles.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200 border-dashed">
            <Cat className="h-12 w-12 text-stone-400 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">Nessun articolo trovato in questo portale.</p>
            <p className="text-stone-500 text-sm mt-1">Sii il primo gatto a scrivere qualcosa qui!</p>
            <Link 
              to="/edit/new" 
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Scrivi un articolo
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map(article => (
              <Link 
                key={article.id} 
                to={`/article/${article.slug}`}
                className="block p-5 rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition-all group bg-stone-50 hover:bg-white"
              >
                <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-indigo-700 transition-colors">
                  {article.title}
                </h3>
                <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                  {article.content.replace(/[#*_\[\]]/g, '')}
                </p>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {article.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
