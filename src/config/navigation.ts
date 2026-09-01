
import {
    Building2,
    Users,
    History,
    FileText,
    BadgeCheck,
    Briefcase,
    Handshake,
    Globe,
    MapPin,
    Phone,
    Newspaper,
    Megaphone,
    Calendar,
    Presentation,
    BookOpen,
    Lightbulb,
    ShieldCheck,
    Store,
    BarChart3,
    Send,
    Crown,
    type LucideIcon
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    description?: string;
    icon?: LucideIcon;
    items?: NavItem[];
}

export const NAVIGATION_CONFIG: NavItem[] = [
    {
        title: "Request",
        href: "/request",
        icon: Send
    },
    {
        title: "About Us",
        href: "/about",
        items: [
            {
                title: "Mission & Vision",
                href: "/about/mission",
                description: "Our core purpose and future aspirations for DRC trade.",
                icon: Lightbulb
            },
            {
                title: "Leadership",
                href: "/about/leadership",
                description: "Meet the executive team driving our initiatives.",
                icon: Users
            },
            {
                title: "Our History",
                href: "/about/history",
                description: "The evolution of trade and commerce in the DRC.",
                icon: History
            },
            {
                title: "Organizational Structure",
                href: "/about/structure",
                description: "Understand how our departments work together.",
                icon: Building2
            }
        ]
    },
    {
        title: "Products",
        href: "/products",
        items: [
            {
                title: "All Products",
                href: "/products",
                description: "Browse our complete catalog of Congolese exports.",
                icon: Briefcase
            },
            {
                title: "Export Standards",
                href: "/products/standards",
                description: "Quality guidelines and certification requirements.",
                icon: BadgeCheck
            },
            {
                title: "Export Guide",
                href: "/products/export-guide",
                description: "Step-by-step procedures for international buyers.",
                icon: FileText
            }
        ]
    },
    {
        title: "Partnering Opportunities",
        href: "/opportunities",
        items: [
            {
                title: "Current Tenders",
                // The opportunities board is a single page filtered by the
                // `category` query param (see src/app/[locale]/opportunities/page.tsx);
                // there are no per-category route segments. Values must match the
                // OPPORTUNITY_CATEGORIES enum in src/lib/opportunities/categories.ts.
                href: "/opportunities?category=tender",
                description: "Official government and private sector contract bids.",
                icon: FileText
            },
            {
                title: "Partner Searches",
                href: "/opportunities?category=partner_search",
                description: "Strategic partnerships for large-scale projects.",
                icon: Handshake
            },
            {
                title: "Invest in DRC",
                href: "/opportunities?category=investment_call",
                description: "Why the DRC is your next major investment destination.",
                icon: Globe
            }
        ]
    },
    {
        title: "Local Contact Points",
        href: "/contact-points",
        items: [
            {
                title: "Regional Offices",
                href: "/contact-points/regional",
                description: "Find support in your specific province or region.",
                icon: MapPin
            },
            {
                title: "Support Centers",
                href: "/contact-points/support",
                description: "Direct assistance for technical and trade inquiries.",
                icon: Phone
            }
        ]
    },
    {
        title: "News & Events",
        href: "/news",
        items: [
            {
                title: "Latest News",
                href: "/news",
                description: "Updates on policy, trade agreements, and market trends.",
                icon: Newspaper
            },
            {
                title: "Press Releases",
                href: "/news/press",
                description: "Official statements and announcements.",
                icon: Megaphone
            },
            {
                title: "Upcoming Events",
                href: "/events",
                description: "Trade fairs, expos, and business forums.",
                icon: Calendar
            },
            {
                title: "Webinars",
                href: "/events/webinars",
                description: "Online educational sessions and industry talks.",
                icon: Presentation
            }
        ]
    },
    {
        title: "Resources",
        href: "/blog",
        items: [
            {
                title: "Blog & Insights",
                href: "/blog",
                description: "Expert analysis and success stories from the field.",
                icon: BookOpen
            },
            {
                title: "Reports & Data",
                href: "/resources/reports",
                description: "Downloadable economic reports and trade statistics.",
                icon: FileText
            }
        ]
    },
    {
        title: "Marketplace",
        href: "/market",
        icon: Store
    },
    {
        title: "Pricing",
        href: "/pricing",
        icon: Crown
    },
    {
        title: "Data Hub",
        href: "/data-hub",
        icon: BarChart3
    },
    {
        title: "Trust Center",
        href: "/trust",
        icon: ShieldCheck
    }
];
