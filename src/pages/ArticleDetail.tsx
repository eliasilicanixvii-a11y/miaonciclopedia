import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, increment, setDoc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Article, Comment } from '../types';
import { useAuth } from '../AuthContext';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Heart, Edit, Trash2, Clock, User, Tag, MessageSquare, ThumbsDown, Send, Folder, Info, List } from 'lucide-react';

// Helper to extract text from React children
const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children && typeof children === 'object' && children.props && children.props.children) {
    return extractText(children.props.children);
  }
  return '';
};

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<{ id: string, text: string }[]>([]);
  
  // Voting states
  const [hasPurred, setHasPurred] = useState(false);
  const [purring, setPurring] = useState(false);
  const [hasHissed, setHasHissed] = useState(false);
  const [hissing, setHissing] = useState(false);

  // Comments states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    const fetchArticleAndInteractions = async () => {
      if (!slug) return;
      
      try {
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const articleData = { id: docData.id, ...docData.data() } as Article;
          setArticle(articleData);
          
          // Generate ToC from markdown content (H2 headings)
          const headings: { id: string, text: string }[] = [];
          const regex = /^##\s+(.+)$/gm;
          let match;
          // Remove bold/italic markers for the ToC text
          while ((match = regex.exec(articleData.content)) !== null) {
            const rawText = match[1].trim();
            const cleanText = rawText.replace(/[*_~`]/g, '');
            const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            headings.push({ id, text: cleanText });
          }
          setToc(headings);
          
          // Check user interactions
          if (user) {
            const purrId = `${user.uid}_${articleData.id}`;
            const purrDoc = await getDoc(doc(db, 'purrs', purrId));
            setHasPurred(purrDoc.exists());

            const hissId = `${user.uid}_${articleData.id}`;
            const hissDoc = await getDoc(doc(db, 'hisses', hissId));
            setHasHissed(hissDoc.exists());
          }

          // Fetch comments
          const commentsQuery = query(collection(db, 'comments'), where('articleId', '==', articleData.id));
          const commentsSnap = await getDocs(commentsQuery);
          const commentsData = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
          // Sort client-side to avoid needing a composite index
          commentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setComments(commentsData);

        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Errore nel caricamento dell'articolo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndInteractions();
  }, [slug, user]);

  const handlePurr = async () => {
    if (!user || !article || purring) return;
    setPurring(true);
    
    const purrId = `${user.uid}_${article.id}`;
    const purrRef = doc(db, 'purrs', purrId);
    const articleRef = doc(db, 'articles', article.id);
    
    try {
      if (hasPurred) {
        await deleteDoc(purrRef);
        await updateDoc(articleRef, { purrsCount: increment(-1) });
        setArticle(prev => prev ? { ...prev, purrsCount: prev.purrsCount - 1 } : null);
        setHasPurred(false);
      } else {
        await setDoc(purrRef, { userId: user.uid, articleId: article.id, createdAt: new Date().toISOString() });
        await updateDoc(articleRef, { purrsCount: increment(1) });
        setArticle(prev => prev ? { ...prev, purrsCount: prev.purrsCount + 1 } : null);
        setHasPurred(true);
      }
    } catch (error) {
      console.error("Errore durante il purr:", error);
    } finally {
      setPurring(false);
    }
  };

  const handleHiss = async () => {
    if (!user || !article || hissing) return;
    setHissing(true);
    
    const hissId = `${user.uid}_${article.id}`;
    const hissRef = doc(db, 'hisses', hissId);
    const articleRef = doc(db, 'articles', article.id);
    
    try {
      if (hasHissed) {
        await deleteDoc(hissRef);
        await updateDoc(articleRef, { hissesCount: increment(-1) });
        setArticle(prev => prev ? { ...prev, hissesCount: (prev.hissesCount || 0) - 1 } : null);
        setHasHissed(false);
      } else {
        await setDoc(hissRef, { userId: user.uid, articleId: article.id, createdAt: new Date().toISOString() });
        await updateDoc(articleRef, { hissesCount: increment(1) });
        setArticle(prev => prev ? { ...prev, hissesCount: (prev.hissesCount || 0) + 1 } : null);
        setHasHissed(true);
      }
    } catch (error) {
      console.error("Errore durante l'hiss:", error);
    } finally {
      setHissing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !article || !newComment.trim() || postingComment) return;
    
    setPostingComment(true);
    try {
      const commentData = {
        articleId: article.id,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL || '',
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments(prev => [{ id: docRef.id, ...commentData } as Comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error("Errore durante l'invio del commento:", error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!article || !user) return;
    try {
      await deleteDoc(doc(db, 'articles', article.id));
      navigate('/');
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      alert("Errore durante l'eliminazione.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">Articolo non trovato</h1>
        <p className="text-stone-600 mb-8">Sembra che un cane abbia mangiato questa pagina.</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors">
          Torna alla cuccia (Home)
        </Link>
      </div>
    );
  }

  const isAuthorOrAdmin = user && (user.uid === article.authorId || user.role === 'admin');

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8 border-b border-stone-200 pb-8">
        {article.category && (
          <div className="mb-4">
            <Link 
              to={`/portal/${article.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
              className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
            >
              <Folder className="h-4 w-4" />
              {article.category}
            </Link>
          </div>
        )}
        
        <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-stone-900 mb-6 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-indigo-500" />
              <Link to={`/profile/${article.authorId}`} className="font-medium text-stone-900 hover:text-indigo-600 hover:underline">
                {article.authorName}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-stone-400" />
              <span>{format(new Date(article.createdAt), 'dd MMMM yyyy', { locale: it })}</span>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-stone-400" />
                <div className="flex gap-1">
                  {article.tags.map(tag => (
                    <span key={tag} className="bg-stone-100 px-2 py-0.5 rounded-md text-xs font-medium text-stone-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthorOrAdmin && (
              <div className="flex gap-2 mr-4 border-r border-stone-200 pr-4">
                <Link
                  to={`/edit/${article.id}`}
                  className="p-2 text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Modifica"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Voting System */}
            <div className="flex items-center gap-2 bg-stone-50 rounded-full p-1 border border-stone-200">
              <button
                onClick={handlePurr}
                disabled={!user || purring}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  hasPurred 
                    ? 'bg-red-100 text-red-700' 
                    : 'hover:bg-stone-200 text-stone-600'
                } ${!user && 'opacity-50 cursor-not-allowed'}`}
                title={!user ? "Accedi per fare le fusa" : "Fusa (Mi piace)"}
              >
                <Heart className={`h-4 w-4 ${hasPurred ? 'fill-current' : ''}`} />
                <span className="font-bold text-sm">{article.purrsCount}</span>
              </button>
              
              <div className="w-px h-4 bg-stone-300"></div>
              
              <button
                onClick={handleHiss}
                disabled={!user || hissing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  hasHissed 
                    ? 'bg-stone-800 text-white' 
                    : 'hover:bg-stone-200 text-stone-600'
                } ${!user && 'opacity-50 cursor-not-allowed'}`}
                title={!user ? "Accedi per soffiare" : "Soffio (Non mi piace)"}
              >
                <ThumbsDown className={`h-4 w-4 ${hasHissed ? 'fill-current' : ''}`} />
                <span className="font-bold text-sm">{article.hissesCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Informational Comment */}
      {article.infoComment && (
        <section className="mb-12 bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-200 pb-3">
            <Info className="h-5 w-5 text-indigo-600" />
            Commento Informativo
          </h3>
          <div className="space-y-4">
            {article.infoComment.split('\n').map((line, idx) => {
              if (!line.trim()) return null;
              
              // Determine speaker color based on index to simulate different people
              const colors = [
                'bg-indigo-100 text-indigo-900 border-indigo-200 rounded-tl-sm',
                'bg-emerald-100 text-emerald-900 border-emerald-200 rounded-tr-sm',
                'bg-amber-100 text-amber-900 border-amber-200 rounded-tl-sm',
              ];
              const alignment = idx % 2 === 0 ? 'justify-start' : 'justify-end';
              const colorClass = colors[idx % colors.length];
              const cleanLine = line.replace(/^-\s*/, '');

              return (
                <div key={idx} className={`flex ${alignment}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl border shadow-sm ${colorClass}`}>
                    <p className="text-sm font-medium">{cleanLine}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Table of Contents */}
      {toc.length > 0 && (
        <div className="mb-12 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2 border-b border-stone-200 pb-3">
            <List className="h-5 w-5 text-indigo-600" />
            Sommario
          </h3>
          <ul className="space-y-2">
            {toc.map((heading, idx) => (
              <li key={idx}>
                <a 
                  href={`#${heading.id}`}
                  className="text-stone-600 hover:text-indigo-600 hover:underline transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-a:text-indigo-600 hover:prose-a:text-indigo-800 mb-16">
        <ReactMarkdown
          components={{
            h2: ({ node, children, ...props }) => {
              const rawText = extractText(children);
              const cleanText = rawText.replace(/[*_~`]/g, '');
              const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              return <h2 id={id} className="scroll-mt-24" {...props}>{children}</h2>;
            }
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Comments Section */}
      <section className="border-t border-stone-200 pt-12">
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-8 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          Miagolii ({comments.length})
        </h2>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handlePostComment} className="mb-10 bg-stone-50 p-6 rounded-2xl border border-stone-200">
            <div className="flex gap-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold flex-shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Aggiungi il tuo miagolio..."
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  rows={3}
                  required
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Miagola
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-10 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
            <p className="text-indigo-800 mb-4">Devi essere un gatto registrato per poter miagolare.</p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-stone-500 italic text-center py-8">Nessun miagolio ancora. Sii il primo a farti sentire!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-4 p-4 bg-white border border-stone-100 rounded-xl shadow-sm">
                {comment.authorPhoto ? (
                  <img src={comment.authorPhoto} alt={comment.authorName} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold flex-shrink-0">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <Link to={`/profile/${comment.authorId}`} className="font-bold text-stone-900 hover:text-indigo-600 hover:underline">
                      {comment.authorName}
                    </Link>
                    <span className="text-xs text-stone-400">
                      {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', { locale: it })}
                    </span>
                  </div>
                  <p className="text-stone-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
