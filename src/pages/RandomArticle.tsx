import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Cat } from 'lucide-react';

export default function RandomArticle() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRandom = async () => {
      try {
        // In a real app with many docs, you'd use a more efficient random approach
        // (e.g., random ID generation or a specific random field).
        // For this small app, fetching all IDs is acceptable.
        const snapshot = await getDocs(collection(db, 'articles'));
        
        if (snapshot.empty) {
          navigate('/');
          return;
        }

        const docs = snapshot.docs;
        const randomIndex = Math.floor(Math.random() * docs.length);
        const randomDoc = docs[randomIndex];
        const slug = randomDoc.data().slug;
        
        navigate(`/article/${slug}`);
      } catch (error) {
        console.error("Errore nel caricamento di un articolo casuale:", error);
        navigate('/');
      }
    };

    fetchRandom();
  }, [navigate]);

  return (
    <div className="flex flex-col justify-center items-center h-64 text-indigo-600">
      <Cat className="h-16 w-16 animate-bounce mb-4" />
      <p className="text-lg font-serif font-bold">Il gatto sta scegliendo un gomitolo a caso...</p>
    </div>
  );
}
