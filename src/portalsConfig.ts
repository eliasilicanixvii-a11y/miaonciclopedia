import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Cat, FileText, Fish, Zap, ShieldAlert, Coffee, Star } from 'lucide-react';

export interface PortalConfig {
  slug: string;
  name: string;
  color: string;
  iconName: string;
  description: string;
}

export const DEFAULT_PORTALS: PortalConfig[] = [
  {
    slug: 'razze-feline',
    name: 'Razze Feline',
    color: 'bg-indigo-900',
    iconName: 'Cat',
    description: 'Scopri tutte le razze feline, dai maestosi Maine Coon ai misteriosi Sphynx.'
  },
  {
    slug: 'salute-e-alimentazione',
    name: 'Salute e Alimentazione',
    color: 'bg-emerald-800',
    iconName: 'Fish',
    description: 'Tutto quello che devi sapere per mantenere il tuo gatto in forma e in salute.'
  },
  {
    slug: 'comportamento',
    name: 'Comportamento',
    color: 'bg-amber-700',
    iconName: 'Zap',
    description: 'Perché il gatto fissa il vuoto? Scoprilo qui.'
  },
  {
    slug: 'gossip-felino',
    name: 'Gossip Felino',
    color: 'bg-rose-800',
    iconName: 'Star',
    description: 'Le ultime notizie scandalose dal mondo dei gatti VIP.'
  },
  {
    slug: 'tecnologia-da-graffiare',
    name: 'Tecnologia da Graffiare',
    color: 'bg-slate-800',
    iconName: 'FileText',
    description: 'Recensioni di tiragraffi hi-tech e lettiere autopulenti.'
  },
  {
    slug: 'complotti-canini',
    name: 'Complotti Canini',
    color: 'bg-red-900',
    iconName: 'ShieldAlert',
    description: 'Tutta la verità sui piani segreti dei cani per dominare il mondo.'
  },
  {
    slug: 'lifestyle-croccantini',
    name: 'Lifestyle & Croccantini',
    color: 'bg-orange-800',
    iconName: 'Coffee',
    description: 'Vivere la bella vita, un pisolino alla volta.'
  },
  {
    slug: 'vip-very-important-pets',
    name: 'VIP (Very Important Pets)',
    color: 'bg-fuchsia-900',
    iconName: 'Star',
    description: 'I gatti più famosi di internet e della storia.'
  }
];

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Cat': return Cat;
    case 'Fish': return Fish;
    case 'Zap': return Zap;
    case 'Star': return Star;
    case 'FileText': return FileText;
    case 'ShieldAlert': return ShieldAlert;
    case 'Coffee': return Coffee;
    default: return Cat;
  }
};

export const fetchPortals = async (): Promise<PortalConfig[]> => {
  try {
    const docRef = doc(db, 'settings', 'portals');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().list) {
      return docSnap.data().list as PortalConfig[];
    }
  } catch (err) {
    console.error("Error fetching portals:", err);
  }
  return DEFAULT_PORTALS;
};
