import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Article } from '../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { User as UserIcon, Calendar, FileText, Heart, PlusCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      try {
        // Fetch user
        if (id === 'system') {
          setProfileUser({
            uid: 'system',
            displayName: 'Miaonciclopedia AI',
            email: 'ai@miaonciclopedia.cat',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Miaonciclopedia',
            role: 'admin',
            createdAt: new Date('2024-01-01').toISOString()
          });
        } else {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            setProfileUser(userDoc.data() as User);
          } else {
            setProfileUser(null);
          }
        }

        // Fetch user's articles
        const q = query(
          collection(db, 'articles'), 
          where('authorId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const articlesSnap = await getDocs(q);
        setUserArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
        
      } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">Gatto Smarrito</h1>
        <p className="text-stone-600">Questo utente non esiste o ha cambiato lettiera.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-8 mb-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-50 border-b border-indigo-100"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {profileUser.photoURL ? (
            <img 
              src={profileUser.photoURL} 
              alt={profileUser.displayName} 
              className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md mb-4"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-indigo-100 border-4 border-white shadow-md flex items-center justify-center text-indigo-800 text-4xl font-bold mb-4">
              {profileUser.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
            {profileUser.displayName}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-stone-600 mb-6">
            <span className="flex items-center gap-1 bg-stone-100 px-3 py-1 rounded-full">
              <UserIcon className="h-4 w-4 text-indigo-500" />
              {profileUser.role === 'admin' ? 'Amministratore Felino' : 'Gatto Semplice'}
            </span>
            <span className="flex items-center gap-1 bg-stone-100 px-3 py-1 rounded-full">
              <Calendar className="h-4 w-4 text-stone-400" />
              Iscritto dal {format(new Date(profileUser.createdAt), 'MMMM yyyy', { locale: it })}
            </span>
          </div>

          {user && user.uid === profileUser.uid && (
            <Link 
              to="/create-portal" 
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Crea Portale
            </Link>
          )}
        </div>
      </div>

      {/* User's Articles */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-200 pb-2">
          <FileText className="text-indigo-600 h-6 w-6" />
          Graffi di {profileUser.displayName} ({userArticles.length})
        </h2>
        
        {userArticles.length === 0 ? (
          <p className="text-stone-500 italic p-6 bg-stone-50 rounded-2xl border border-stone-100 text-center">
            Questo gatto è troppo pigro e non ha ancora scritto nulla.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {userArticles.map(article => (
              <Link 
                key={article.id}
                to={`/article/${article.slug}`}
                className="block p-6 bg-white border border-stone-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <h3 className="text-lg font-bold text-indigo-900 group-hover:text-indigo-600 mb-2">
                  {article.title}
                </h3>
                <p className="text-stone-600 text-sm line-clamp-2 mb-4">
                  {article.content.replace(/[#*_\[\]]/g, '').substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(article.createdAt), 'dd MMM yyyy', { locale: it })}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    <Heart className="h-3 w-3 fill-current" />
                    {article.purrsCount} Fusa
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
