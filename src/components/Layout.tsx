import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Cat, Search, LogIn, LogOut, PenSquare, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { fetchPortals, PortalConfig } from '../portalsConfig';

function SearchBar({ isMobile }: { isMobile?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(fetchedArticles);
    }, (error) => {
      console.error("Error fetching articles for search:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const filteredArticles = searchQuery.trim() === '' 
    ? [] 
    : articles.filter(article => 
        (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (article.content && article.content.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  return (
    <div ref={wrapperRef} className={`relative ${isMobile ? 'flex-1' : 'flex-1'}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-stone-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-full leading-5 bg-stone-50 placeholder-stone-500 focus:outline-none focus:placeholder-stone-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Cerca un gomitolo di lana o un articolo..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
      </form>
      
      {showDropdown && filteredArticles.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
          <ul className="max-h-60 overflow-auto py-1">
            {filteredArticles.map(article => (
              <li key={article.id}>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                    navigate(`/article/${article.slug}`);
                  }}
                >
                  <div className="font-medium text-stone-900 truncate">{article.title}</div>
                  <div className="text-xs text-stone-500 truncate">
                    {article.content.replace(/[#*_\[\]]/g, '').substring(0, 60)}...
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, signIn, logOut } = useAuth();
  const [portals, setPortals] = useState<PortalConfig[]>([]);

  useEffect(() => {
    const loadPortals = async () => {
      const fetchedPortals = await fetchPortals();
      setPortals(fetchedPortals);
    };
    loadPortals();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-indigo-900 font-serif">
                <Cat className="h-8 w-8 text-indigo-600" />
                <span>Miaonciclopedia</span>
              </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8 hidden md:flex items-center gap-2">
              {/* Language Selector */}
              <select 
                className="bg-stone-50 border border-stone-300 text-stone-700 text-sm rounded-full focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer"
                onChange={(e) => {
                  if (e.target.value !== 'it') {
                    alert('I gatti parlano solo italiano (e miao)! MicioOS non ammette altre lingue.');
                    e.target.value = 'it';
                  }
                }}
              >
                <option value="it">🇮🇹 IT</option>
                <option value="en">🇬🇧 EN</option>
                <option value="meow">🐾 MEOW</option>
              </select>

              <SearchBar />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link 
                    to="/edit/new" 
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <PenSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Scrivi</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
                      title="Pannello di Controllo"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
                    <Link to={`/profile/${user.uid}`} className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full object-cover border border-stone-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                    </Link>
                    <button 
                      onClick={logOut}
                      className="p-2 text-stone-500 hover:text-red-600 transition-colors rounded-full hover:bg-stone-100"
                      title="Esci"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={signIn}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Accedi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search (visible only on small screens) */}
      <div className="md:hidden p-4 bg-white border-b border-stone-200 flex gap-2">
        <select 
          className="bg-stone-50 border border-stone-300 text-stone-700 text-sm rounded-full focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer"
          onChange={(e) => {
            if (e.target.value !== 'it') {
              alert('I gatti parlano solo italiano (e miao)! MicioOS non ammette altre lingue.');
              e.target.value = 'it';
            }
          }}
        >
          <option value="it">🇮🇹 IT</option>
          <option value="en">🇬🇧 EN</option>
          <option value="meow">🐾 MEOW</option>
        </select>
        <SearchBar isMobile />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="font-serif font-bold text-lg mb-3 text-indigo-900 border-b border-stone-100 pb-2">Navigazione Felina</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-stone-600 hover:text-indigo-600 hover:underline">Pagina Principale</Link></li>
                <li><Link to="/all-pages" className="text-stone-600 hover:text-indigo-600 hover:underline">Tutte le Pagine</Link></li>
                <li><Link to="/article/razze-feline" className="text-stone-600 hover:text-indigo-600 hover:underline">Razze Feline</Link></li>
                <li><Link to="/article/alimentazione-gatto" className="text-stone-600 hover:text-indigo-600 hover:underline">Alimentazione</Link></li>
                <li><Link to="/article/linguaggio-corpo" className="text-stone-600 hover:text-indigo-600 hover:underline">Linguaggio del Corpo</Link></li>
                <li><Link to="/random" className="text-stone-600 hover:text-indigo-600 hover:underline">Una pagina a caso</Link></li>
                <li><Link to="/ideas" className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline flex items-center gap-1 mt-2 pt-2 border-t border-stone-100">💡 Generatore di Idee</Link></li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="font-serif font-bold text-lg mb-3 text-indigo-900 border-b border-stone-100 pb-2">Portali</h3>
              <ul className="space-y-2 text-sm">
                {portals.slice(0, 5).map(portal => (
                  <li key={portal.slug}>
                    <Link to={`/portal/${portal.slug}`} className="text-stone-600 hover:text-indigo-600 hover:underline">
                      {portal.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="font-serif font-bold text-lg mb-3 text-indigo-900 border-b border-stone-100 pb-2">Pagine Nonsense</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/nonsense/gomitolo" className="text-stone-600 hover:text-indigo-600 hover:underline">Il Gomitolo Infinito</Link></li>
                <li><Link to="/nonsense/scatola" className="text-stone-600 hover:text-indigo-600 hover:underline">Teoria della Scatola Vuota</Link></li>
                <li><Link to="/nonsense/croccantini" className="text-stone-600 hover:text-indigo-600 hover:underline">Croccantini Quantistici</Link></li>
              </ul>
            </div>
          </aside>

          {/* Page Content */}
          <div className="flex-1 min-w-0 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-8 text-center text-sm text-stone-500">
        <p>Miaonciclopedia &copy; 2026 - L'enciclopedia che cade sempre in piedi.</p>
        <p className="mt-2 text-xs">I contenuti sono disponibili sotto licenza "Gatto Randagio" (fai quello che vuoi, ma lasciami un croccantino).</p>
      </footer>
    </div>
  );
}
