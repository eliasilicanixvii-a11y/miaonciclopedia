import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';

export default function AllPages() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'), orderBy('title', 'asc'));
        const querySnapshot = await getDocs(q);
        setArticles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      } catch (error) {
        console.error("Errore nel caricamento degli articoli:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-stone-200 pb-4">
        <FileText className="h-8 w-8 text-indigo-600" />
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          Tutte le Pagine
        </h1>
      </div>

      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-stone-400" />
        </div>
        <input
          type="text"
          placeholder="Filtra per titolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
          <p className="text-stone-600 text-lg">Nessuna pagina trovata. Miau.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-stone-200">
            {filteredArticles.map(article => (
              <li key={article.id} className="hover:bg-indigo-50 transition-colors">
                <Link to={`/article/${article.slug}`} className="block px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-indigo-900">{article.title}</h2>
                      <p className="text-sm text-stone-500 mt-1">
                        Categoria: {article.category || 'Nessuna'} • Autore: {article.authorName}
                      </p>
                    </div>
                    <div className="text-stone-400">
                      &rarr;
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
