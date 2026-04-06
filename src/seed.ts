import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const initialArticles = [
  {
    title: 'Razze Feline',
    slug: 'razze-feline',
    content: '# Le Razze Feline\n\nEsistono tantissime razze di gatti, ognuna con le proprie caratteristiche uniche. Dal maestoso Maine Coon al senza pelo Sphynx, c\'è un gatto per tutti i gusti.\n\n## Maine Coon\nIl gigante buono. Sono gatti di taglia grande, con un pelo folto e un carattere molto affettuoso.\n\n## Siamese\nEleganti e chiacchieroni. I siamesi sono noti per i loro occhi azzurri e il loro miagolio insistente.\n\n## Persiano\nTranquilli e dal muso schiacciato. Richiedono molta cura per il loro pelo lungo, ma sono compagni perfetti per la vita in appartamento.',
    authorId: 'system',
    authorName: 'Miaonciclopedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['razze', 'gatti'],
    category: 'Razze Feline',
    purrsCount: 42,
    hissesCount: 0
  },
  {
    title: 'Alimentazione del Gatto',
    slug: 'alimentazione-gatto',
    content: '# Alimentazione del Gatto\n\nI gatti sono carnivori obbligati. Questo significa che la loro dieta deve essere basata principalmente sulla carne.\n\n## Cibo Secco vs Umido\nEntrambi hanno i loro pro e contro. Il cibo umido aiuta l\'idratazione (i gatti bevono poco per natura), mentre i croccantini sono comodi e aiutano la pulizia dei denti. L\'ideale è un mix di entrambi.\n\n## Cibi Vietati\n- Cioccolato\n- Cipolla e aglio\n- Uva e uvetta\n- Latte (molti gatti sono intolleranti al lattosio da adulti)',
    authorId: 'system',
    authorName: 'Miaonciclopedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['cibo', 'salute'],
    category: 'Salute e Alimentazione',
    purrsCount: 15,
    hissesCount: 1
  },
  {
    title: 'Linguaggio del Corpo',
    slug: 'linguaggio-corpo',
    content: '# Il Linguaggio del Corpo Felino\n\nCapire cosa ci sta dicendo il nostro gatto è fondamentale per una buona convivenza.\n\n## La Coda\n- **Alta e dritta**: Felice e sicuro di sé.\n- **A forma di punto interrogativo**: Incuriosito o giocherellone.\n- **Bassa o tra le gambe**: Spaventato o sottomesso.\n- **Gonfia**: Terrorizzato o pronto ad attaccare.\n\n## Le Orecchie\n- **Dritte in avanti**: Attento e rilassato.\n- **Appiattite all\'indietro**: Arrabbiato o spaventato (pronto a difendersi).\n\n## Le Fusa\nGeneralmente indicano contentezza, ma a volte i gatti fanno le fusa anche quando provano dolore o stress, per auto-calmarsi.',
    authorId: 'system',
    authorName: 'Miaonciclopedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['comportamento', 'comunicazione'],
    category: 'Comportamento',
    purrsCount: 89,
    hissesCount: 0
  },
  {
    title: 'Mr. Bean',
    slug: 'mr-bean',
    content: '# Mr. Bean\n\nMr. Bean è un personaggio comico interpretato dall\'attore britannico Rowan Atkinson. Sebbene non sia un gatto, il suo comportamento a volte può ricordare quello di un felino dispettoso e curioso.\n\n## Caratteristiche\n- Non parla quasi mai, si esprime a gesti (proprio come i gatti con la coda!).\n- Ha un orsacchiotto di peluche chiamato Teddy, che tratta come un cucciolo.\n- Trova soluzioni assurde a problemi semplici.\n\n## Rapporto con gli animali\nIn alcuni episodi, Mr. Bean ha a che fare con animali, tra cui anche gatti, spesso con risultati disastrosi e comici.',
    authorId: 'system',
    authorName: 'Miaonciclopedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['tv', 'commedia', 'mr-bean'],
    category: 'VIP (Very Important Pets)',
    purrsCount: 120,
    hissesCount: 2,
    infoComment: '- È uscita una nuova stagione di Mr. Bean!\n- Perfetto, guardo The Garfield Show.'
  },
  {
    title: 'The Garfield Show',
    slug: 'the-garfield-show',
    content: '# The Garfield Show\n\nThe Garfield Show è una serie animata in CGI basata sul celebre fumetto di Jim Davis. Il protagonista è Garfield, il gatto arancione più pigro e goloso del mondo.\n\n## Personaggi Principali\n- **Garfield**: Gatto soriano arancione. Ama le lasagne, odia il lunedì e i ragni. Il suo passatempo preferito è dormire e tormentare Odie.\n- **Odie**: Il cane di casa, di buon cuore ma non molto intelligente. È la vittima preferita degli scherzi di Garfield.\n- **Jon Arbuckle**: Il padrone di Garfield e Odie. Un fumettista un po\' imbranato ma dal cuore d\'oro.\n- **Nermal**: Il gattino più carino del mondo, che Garfield cerca costantemente di spedire ad Abu Dhabi.\n\n## Temi\nLa serie esplora le avventure quotidiane di Garfield, spesso guidate dalla sua fame insaziabile o dal suo desiderio di evitare qualsiasi tipo di sforzo fisico.',
    authorId: 'system',
    authorName: 'Miaonciclopedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['tv', 'animazione', 'garfield', 'gatti-famosi'],
    category: 'VIP (Very Important Pets)',
    purrsCount: 340,
    hissesCount: 5,
    infoComment: '- Hai visto l\'ultimo episodio di The Garfield Show?\n- Sì, Garfield ha mangiato 10 teglie di lasagne!\n- Tipico di lui.'
  }
];

export async function seedArticles() {
  try {
    const articlesRef = collection(db, 'articles');
    
    for (const article of initialArticles) {
      const q = query(articlesRef, where('slug', '==', article.slug));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const newDocRef = doc(articlesRef);
        const articleData: any = {
          ...article,
          id: newDocRef.id,
          purrsCount: 0,
          hissesCount: 0
        };
        await setDoc(newDocRef, articleData);
        console.log(`Seeded article: ${article.title}`);
      } else {
        // Force update to ensure category and infoComment are set correctly
        const existingDoc = snapshot.docs[0];
        const updateData: any = {
          category: article.category,
          updatedAt: new Date().toISOString(),
          authorId: article.authorId,
          authorName: article.authorName
        };
        if (article.infoComment) {
          updateData.infoComment = article.infoComment;
        }
        await setDoc(doc(articlesRef, existingDoc.id), updateData, { merge: true });
        console.log(`Updated existing seeded article: ${article.title}`);
      }
    }
  } catch (error) {
    console.error('Error seeding articles:', error);
    throw error;
  }
}
