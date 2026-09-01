export type NewsItem = {
    id: string;
    title: {
        en: string;
        fr: string;
    };
    excerpt: {
        en: string;
        fr: string;
    };
    content: {
        en: string;
        fr: string;
    };
    date: string;
    category: "Economy" | "Trade" | "Regulation";
    imageUrl: string;
};

export type EventItem = {
    id: string;
    title: {
        en: string;
        fr: string;
    };
    description: {
        en: string;
        fr: string;
    };
    location: string;
    date: string; // ISO date string
    time: string;
    registrationUrl: string;
};

export type BlogPost = {
    id: string;
    title: {
        en: string;
        fr: string;
    };
    excerpt: {
        en: string;
        fr: string;
    };
    author: string;
    date: string;
    readTime: string;
    imageUrl: string;
};

export type Company = {
    id: string;
    name: string;
    description: string;
    sector: string;
    province: string;
    city: string;
    address: string;
    verified: boolean;
    companyType: string;
    yearEstablished: number;
    certifications: string[];
    website?: string;
    email?: string;
    phone?: string;
    capacity?: string;
    moq?: string;
    leadTime?: string;
};

export const MOCK_NEWS: NewsItem[] = [
    {
        id: "1",
        title: {
            en: "DRC Trade Balance Shows Positive Growth in Q4",
            fr: "La Balance Commerciale de la RDC Affiche une Croissance Positive au T4"
        },
        excerpt: {
            en: "Exports have increased by 15% due to rising demand for copper and cobalt.",
            fr: "Les exportations ont augmenté de 15% en raison de la demande croissante de cuivre et de cobalt."
        },
        content: {
            en: "Detailed report on trade balance...",
            fr: "Rapport détaillé sur la balance commerciale..."
        },
        date: "2025-12-15",
        category: "Economy",
        imageUrl: "/images/news/economy-growth.jpg"
    },
    {
        id: "2",
        title: {
            en: "New Regulations for Agricultural Exports",
            fr: "Nouvelles Réglementations pour les Exportations Agricoles"
        },
        excerpt: {
            en: "The Ministry of Trade announces streamlined procedures for coffee and cocoa exports.",
            fr: "Le Ministère du Commerce annonce des procédures simplifiées pour l'exportation de café et de cacao."
        },
        content: {
            en: "Full details on new regulations...",
            fr: "Détails complets sur les nouvelles réglementations..."
        },
        date: "2025-11-20",
        category: "Regulation",
        imageUrl: "/images/news/agri-export.jpg"
    },
    {
        id: "3",
        title: {
            en: "Strategic Partnership Signed with European Union",
            fr: "Signature d'un Partenariat Stratégique avec l'Union Européenne"
        },
        excerpt: {
            en: "A landmark deal to boost sustainable mining and infrastructure development.",
            fr: "Un accord historique pour stimuler l'exploitation minière durable et le développement des infrastructures."
        },
        content: {
            en: "Details of the EU partnership...",
            fr: "Détails du partenariat avec l'UE..."
        },
        date: "2025-10-05",
        category: "Trade",
        imageUrl: "/images/news/eu-partnership.jpg"
    }
];

export const MOCK_EVENTS: EventItem[] = [
    {
        id: "1",
        title: {
            en: "Kinshasa International Trade Fair 2026",
            fr: "Foire Internationale de Kinshasa 2026"
        },
        description: {
            en: "The largest trade gathering in Central Africa, featuring over 500 exhibitors.",
            fr: "Le plus grand rassemblement commercial en Afrique centrale, avec plus de 500 exposants."
        },
        location: "FIKIN, Kinshasa",
        date: "2026-07-10",
        time: "09:00 - 18:00",
        registrationUrl: "/register-company"
    },
    {
        id: "2",
        title: {
            en: "Mining Indaba Setup Conference",
            fr: "Conférence Préparatoire Mining Indaba"
        },
        description: {
            en: "A preparatory meeting for DRC stakeholders attending the global Mining Indaba.",
            fr: "Une réunion préparatoire pour les acteurs de la RDC participant au Mining Indaba mondial."
        },
        location: "Grand Hotel, Kinshasa",
        date: "2026-02-15",
        time: "10:00 - 16:00",
        registrationUrl: "/register-company"
    },
    {
        id: "3",
        title: {
            en: "Agri-Business Investment Forum",
            fr: "Forum sur l'Investissement Agro-industriel"
        },
        description: {
            en: "Connecting local farmers with international investors and technology providers.",
            fr: "Connecter les agriculteurs locaux avec des investisseurs internationaux et des fournisseurs de technologies."
        },
        location: "Lubumbashi",
        date: "2026-09-22",
        time: "09:00 - 17:00",
        registrationUrl: "/register-company"
    }
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
    {
        id: "1",
        title: {
            en: "How to Start Exporting Coffee from DRC",
            fr: "Comment Commencer à Exporter du Café de la RDC"
        },
        excerpt: {
            en: "A step-by-step guide to navigating permits, logistics, and international standards.",
            fr: "Un guide étape par étape pour naviguer dans les permis, la logistique et les normes internationales."
        },
        author: "Jean Kabuya",
        date: "2025-12-01",
        readTime: "5 min read",
        imageUrl: "/images/blog/coffee-export.jpg"
    },
    {
        id: "2",
        title: {
            en: "Understanding the New Special Economic Zones",
            fr: "Comprendre les Nouvelles Zones Économiques Spéciales"
        },
        excerpt: {
            en: "Tax incentives and benefits for companies operating in the Maluku SEZ.",
            fr: "Incitations fiscales et avantages pour les entreprises opérant dans la ZES de Maluku."
        },
        author: "Sarah Mbuyi",
        date: "2025-11-15",
        readTime: "8 min read",
        imageUrl: "/images/blog/sez-zone.jpg"
    },
    {
        id: "3",
        title: {
            en: "Digital Transformation in Congolese Customs",
            fr: "Transformation Numérique des Douanes Congolaises"
        },
        excerpt: {
            en: "How the new digital single window system is reducing clearance times.",
            fr: "Comment le nouveau système de guichet unique numérique réduit les délais de dédouanement."
        },
        author: "Ministry of Trade",
        date: "2025-10-20",
        readTime: "4 min read",
        imageUrl: "/images/blog/digital-customs.jpg"
    }
];

export const MOCK_COMPANIES: Company[] = [
    {
        id: "1",
        name: "Générale des Carrières et des Mines (Gécamines)",
        description: "Gécamines is the leading state-owned mining company in the DRC, specializing in the extraction and processing of copper and cobalt.",
        sector: "Mining",
        province: "Haut-Katanga",
        city: "Lubumbashi",
        address: "Boulevard Kamanyola, Lubumbashi",
        verified: true,
        companyType: "State-Owned Enterprise",
        yearEstablished: 1966,
        certifications: ["ISO 9001", "Responsible Minerals Initiative"],
        website: "https://www.gecamines.cd",
        email: "contact@gecamines.cd",
        phone: "+243 81 000 0000",
        capacity: "10,000 tons/month",
        moq: "1 container",
        leadTime: "30 days"
    },
    {
        id: "2",
        name: "Congo Coffee Exporters Alliance",
        description: "An alliance of small-scale farmers and cooperatives producing high-quality Arabica and Robusta coffee for global markets.",
        sector: "Agriculture",
        province: "Nord-Kivu",
        city: "Goma",
        address: "Avenue du Commerce, Goma",
        verified: true,
        companyType: "Cooperative",
        yearEstablished: 2010,
        certifications: ["Fair Trade", "Organic Certified"],
        website: "https://www.congocoffee.org",
        email: "info@congocoffee.org",
        phone: "+243 82 111 1111",
        capacity: "500 tons/month",
        moq: "10 tons",
        leadTime: "15 days"
    },
    {
        id: "3",
        name: "Bracongo",
        description: "Bracongo is one of the largest brewing companies in the DRC, producing a wide range of beverages and providing significant employment.",
        sector: "Manufacturing",
        province: "Kinshasa",
        city: "Kinshasa",
        address: "Avenue de l'Industrie, Limete, Kinshasa",
        verified: true,
        companyType: "Private Company",
        yearEstablished: 1949,
        certifications: ["ISO 22000", "HACCP"],
        website: "https://www.bracongo.cd",
        email: "info@bracongo.cd",
        phone: "+243 81 222 2222",
        capacity: "1 million hectoliters/year",
        moq: "1000 cases",
        leadTime: "7 days"
    }
];
