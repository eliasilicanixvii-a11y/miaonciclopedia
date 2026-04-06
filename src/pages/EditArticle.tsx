import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Article } from '../types';
import { Save, X, Eye, Edit3, Bold, Italic, Link as LinkIcon, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

export const CATEGORIES = [
  "Razze Feline",
  "Salute e Alimentazione",
  "Comportamento",
  "Gossip Felino",
  "Tecnologia da Graffiare",
  "Complotti Canini",
  "Lifestyle & Croccantini",
  "VIP (Very Important Pets)"
];

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [infoComment, setInfoComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI State
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isNew = id === 'new';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchArticle = async () => {
      if (isNew) {
        setInitialLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'articles', id!);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Article;
          if (user.uid !== data.authorId && user.role !== 'admin') {
            navigate('/');
            return;
          }
          
          setTitle(data.title);
          setContent(data.content);
          setTags(data.tags.join(', '));
          if (data.category) setCategory(data.category);
          if (data.infoComment) setInfoComment(data.infoComment);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error("Errore nel caricamento:", err);
        setError("Errore nel caricamento dell'articolo.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchArticle();
  }, [id, user, isNew, navigate]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + 
                       prefix + selectedText + suffix + 
                       content.substring(end);
                       
    setContent(newContent);
    
    // Set focus back and adjust selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Sei un assistente per Miaonciclopedia, un'enciclopedia a tema gatti.
Scrivi un articolo basato su questo prompt: "${aiPrompt}".
Se l'utente ha fornito un commento informativo ("${infoComment}"), tienilo in considerazione per il tono o il contesto, ma non includerlo nel testo dell'articolo.

REGOLE DI FORMATTAZIONE IMPORTANTI PER IL CONTENUTO MARKDOWN:
1. Usa SEMPRE il doppio a capo (\\n\\n) per separare i paragrafi.
2. Usa SEMPRE il doppio a capo (\\n\\n) PRIMA e DOPO ogni titolo di sezione (es. \\n\\n## Titolo\\n\\n). Questo è fondamentale per far funzionare correttamente il sommario.
3. Non scrivere un blocco di testo unico. Dividi il testo in paragrafi leggibili.

Restituisci un JSON con la seguente struttura:
{
  "title": "Titolo dell'articolo",
  "content": "Contenuto in Markdown (con doppi a capo \\n\\n tra i paragrafi e i titoli ##)",
  "tags": "tag1, tag2, tag3",
  "category": "Una delle categorie: Razze Feline, Salute e Alimentazione, Comportamento, Gossip Felino, Tecnologia da Graffiare, Complotti Canini, Lifestyle & Croccantini, VIP (Very Important Pets)"
}`,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.tags) setTags(data.tags);
        if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      }
      setShowAIPrompt(false);
      setAiPrompt('');
    } catch (err) {
      console.error("Errore generazione AI:", err);
      setError("Errore durante la generazione dell'articolo con l'IA. Riprova.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!title.trim() || !content.trim()) {
      setError("Titolo e contenuto sono obbligatori per i gatti.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5);
      const slug = generateSlug(title);
      const now = new Date().toISOString();

      if (isNew) {
        const newId = doc(collection(db, 'articles')).id;
        const newArticle: Article = {
          id: newId,
          title: title.trim(),
          slug,
          content: content.trim(),
          authorId: user.uid,
          authorName: user.displayName,
          createdAt: now,
          updatedAt: now,
          purrsCount: 0,
          hissesCount: 0,
          tags: tagArray,
          category,
          infoComment: infoComment.trim()
        };
        
        await setDoc(doc(db, 'articles', newId), newArticle);
        navigate(`/article/${slug}`);
      } else {
        const articleRef = doc(db, 'articles', id!);
        await updateDoc(articleRef, {
          title: title.trim(),
          slug,
          content: content.trim(),
          updatedAt: now,
          tags: tagArray,
          category,
          infoComment: infoComment.trim()
        });
        navigate(`/article/${slug}`);
      }
    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      setError("Errore durante il salvataggio. Forse un topo ha rosicchiato i cavi.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          {isNew ? 'Scrivi un nuovo graffio' : 'Modifica articolo'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAIPrompt(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Sparkles className="h-4 w-4" /> Prompt iA
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors font-medium text-sm"
          >
            {isPreview ? <><Edit3 className="h-4 w-4" /> Modifica</> : <><Eye className="h-4 w-4" /> Anteprima</>}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors font-medium text-sm"
          >
            <X className="h-4 w-4" /> Annulla
          </button>
        </div>
      </div>

      {showAIPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-blue-100 rounded-xl">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900">Genera con iA</h2>
            </div>
            <p className="text-stone-600 mb-6">
              Descrivi l'articolo che vuoi scrivere. L'iA genererà titolo, contenuto, tag e categoria. Il commento informativo attuale verrà mantenuto e usato come contesto.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Es: Scrivi un articolo divertente su come i gatti vedono gli aspirapolvere..."
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 min-h-[120px]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAIPrompt(false)}
                className="px-5 py-2.5 rounded-full text-stone-600 font-medium hover:bg-stone-100 transition-colors"
                disabled={isGenerating}
              >
                Annulla
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {isGenerating ? 'Generazione...' : 'Genera Articolo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {isPreview ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 min-h-[500px]">
          <div className="mb-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {category}
            </span>
          </div>
          <h1 className="text-4xl font-serif font-extrabold text-stone-900 mb-8 pb-4 border-b border-stone-200">
            {title || 'Senza Titolo'}
          </h1>
          <div className="prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-a:text-indigo-600">
            <ReactMarkdown>{content || '*Nessun contenuto... miao.*'}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
              Titolo dell'articolo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-serif"
              placeholder="Es: MicioOS 10, La rivoluzione delle fusa"
              required
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-stone-700 mb-1">
                Categoria
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-stone-700 mb-1">
                Tag (separati da virgola, max 5)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Es: micioos, software, croccantini"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="content" className="block text-sm font-medium text-stone-700">
                Contenuto (Markdown supportato)
              </label>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-1.5 text-stone-600 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                  title="Grassetto"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-1.5 text-stone-600 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                  title="Corsivo"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[', '](url)')}
                  className="p-1.5 text-stone-600 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              id="content"
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="Scrivi qui la tua verità felina... Usa il Markdown per formattare."
              required
            />
          </div>

          <div>
            <label htmlFor="infoComment" className="block text-sm font-medium text-stone-700 mb-1">
              Commento Informativo (Opzionale)
            </label>
            <p className="text-xs text-stone-500 mb-2">
              Una parlata fra due o tre persone. Es: "- È uscita una nuova stagione di Mr. Bean! - Perfetto, guardo The Garfield Show."
            </p>
            <textarea
              id="infoComment"
              value={infoComment}
              onChange={(e) => setInfoComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="- Ciao!\n- Miao!"
            />
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
              {loading ? 'Salvataggio...' : 'Salva Articolo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
