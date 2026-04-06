import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { Search as SearchIcon, FileText } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Firestore doesn't support full-text search natively well without extensions,
        // so we'll fetch all articles and filter client-side for this small app.
        // In a real production app, use Algolia or Typesense.
        const articlesRef = collection(db, 'articles');
        const qRef = query(articlesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(qRef);
        
        const allArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        const searchLower = q.toLowerCase();
        const filtered = allArticles.filter(article => 
          (article.title && article.title.toLowerCase().includes(searchLower)) || 
          (article.content && article.content.toLowerCase().includes(searchLower)) ||
          (article.authorName && article.authorName.toLowerCase().includes(searchLower)) ||
          (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
        
        setResults(filtered);
      } catch (error) {
        console.error("Errore durante la ricerca:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [q]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
          <SearchIcon className="h-8 w-8 text-indigo-600" />
          Risultati per "{q}"
        </h1>
        <p className="text-stone-500 mt-2">
          Trovati {results.length} gomitoli di informazioni.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
          <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-stone-700 mb-2">Nessun risultato trovato</h2>
          <p className="text-stone-500 mb-6">Prova a cercare con termini diversi o crea tu l'articolo!</p>
          <Link 
            to="/edit/new" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
          >
            Scrivi "{q}"
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map(article => (
            <Link 
              key={article.id}
              to={`/article/${article.slug}`}
              className="block p-6 bg-white border border-stone-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <h3 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-600 mb-2">
                {article.title}
              </h3>
              <p className="text-stone-600 text-sm line-clamp-3">
                {article.content.replace(/[#*_\[\]]/g, '').substring(0, 250)}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
