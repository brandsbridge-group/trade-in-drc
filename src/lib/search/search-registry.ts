import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Building2, Globe, Home, LayoutDashboard, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { useState, useMemo } from 'react';

export type SearchCategory = 'navigation' | 'actions' | 'companies' | 'resources';

export interface SearchItem {
    id: string;
    title: string;
    description?: string;
    category: SearchCategory;
    icon?: LucideIcon;
    shortcut?: string[];
    action: () => void;
    keywords?: string[];
}

export function useSearchRegistry(onSelect?: () => void) {
    const router = useRouter();
    const t = useTranslations('Search.actions');

    // Static navigation quick actions, surfaced when the FTS query is empty or
    // too short to search. All copy is localized via the Search.actions.* keys.
    const staticItems: SearchItem[] = useMemo(() => [
        {
            id: 'nav-home',
            title: t('home.title'),
            category: 'navigation',
            icon: Home,
            action: () => router.push('/'),
        },
        {
            id: 'nav-dashboard',
            title: t('dashboard.title'),
            description: t('dashboard.description'),
            category: 'navigation',
            icon: LayoutDashboard,
            shortcut: ['G', 'D'],
            action: () => router.push('/dashboard'),
        },
        {
            id: 'nav-companies',
            title: t('companies.title'),
            description: t('companies.description'),
            category: 'navigation',
            icon: Building2,
            action: () => router.push('/companies'),
        },
        {
            id: 'nav-opportunities',
            title: t('opportunities.title'),
            description: t('opportunities.description'),
            category: 'navigation',
            icon: Globe,
            action: () => router.push('/opportunities'),
        },
        {
            id: 'action-register',
            title: t('register.title'),
            description: t('register.description'),
            category: 'actions',
            icon: UserPlus,
            shortcut: ['R'],
            action: () => router.push('/register-company'),
        },
        {
            id: 'action-contact',
            title: t('contact.title'),
            category: 'actions',
            icon: Users,
            action: () => router.push('/contact'),
        },
    ], [router, t]);

    const [query, setQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!query) return staticItems;

        const lowerQuery = query.toLowerCase();
        return staticItems.filter((item) =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery) ||
            item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
        );
    }, [query, staticItems]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Partial<Record<SearchCategory, SearchItem[]>> = {};
        filteredItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category]!.push(item);
        });
        return groups;
    }, [filteredItems]);

    return {
        query,
        setQuery,
        items: filteredItems,
        groupedItems,
        handleSelect: (item: SearchItem) => {
            item.action();
            onSelect?.();
        }
    };
}
