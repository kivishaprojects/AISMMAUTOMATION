import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  CalendarClock,
  NotebookPen,
  KeyRound,
  Share2,
  Palette,
  CreditCard,
  Wallet,
  Receipt,
  Users,
  UserCircle,
  Lock,
  Gauge,
  Search,
  Code2,
  Radar,
  GitBranch,
  Layers,
  Users2,
  FileText,
  Workflow,
  TrendingUp,
  Sparkle,
  Gauge as CommandCenterIcon,
} from "lucide-react";

export type NavLeaf = { label: string; href: string; badge?: string; icon: LucideIcon };
export type NavGroup = { label: string; icon: LucideIcon; items: NavLeaf[] };

export const NAV_TOP: NavLeaf[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Creative Studio",
    icon: ImageIcon,
    items: [
      { label: "Create Images", href: "/dashboard/studio", icon: ImageIcon },
      { label: "Create Videos", href: "/dashboard/studio/videos", icon: Video },
    ],
  },
  {
    label: "Content Calendar",
    icon: CalendarClock,
    items: [
      { label: "Scheduler", href: "/dashboard/scheduler", icon: CalendarClock },
      { label: "Content Planning", href: "/dashboard/content-planning", icon: NotebookPen },
    ],
  },
  {
    label: "SEO Tools",
    icon: Search,
    items: [
      { label: "Keyword Intelligence", href: "/dashboard/seo/keyword-intelligence", icon: Layers },
      { label: "Competitor Intelligence", href: "/dashboard/seo/competitor-intelligence", icon: Users2, badge: "Soon" },
      { label: "Content Studio", href: "/dashboard/seo/content-studio", icon: FileText, badge: "Soon" },
      { label: "Technical SEO Auditor", href: "/dashboard/seo/technical-audit", icon: Gauge },
      { label: "Internal Linking Engine", href: "/dashboard/seo/internal-linking", icon: Workflow, badge: "Soon" },
      { label: "Schema Generator", href: "/dashboard/seo/schema-generator", icon: Code2 },
      { label: "Automation Workflows", href: "/dashboard/seo/automation", icon: Workflow, badge: "Soon" },
      { label: "Rank & AI Visibility", href: "/dashboard/seo/rank-tracking", icon: TrendingUp },
      { label: "LLM / GEO Optimization", href: "/dashboard/seo/llm-optimization", icon: Sparkle, badge: "Soon" },
      { label: "SEO Command Center", href: "/dashboard/seo/command-center", icon: CommandCenterIcon, badge: "Soon" },
    ],
  },
  {
    label: "Social Analytics",
    icon: Radar,
    items: [
      { label: "Page Analyzer", href: "/dashboard/analytics/page-analyzer", icon: Radar },
    ],
  },
  {
    label: "Settings",
    icon: KeyRound,
    items: [
      { label: "My API Keys", href: "/dashboard/settings/api-keys", icon: KeyRound },
      { label: "Social Media Accounts", href: "/dashboard/settings/social-accounts", icon: Share2 },
      { label: "Website Repository", href: "/dashboard/settings/website-repo", icon: GitBranch },
      { label: "Brand Kit", href: "/dashboard/brand-kit", icon: Palette },
      { label: "Subscription", href: "/dashboard/settings/subscription", icon: CreditCard },
      { label: "Wallet", href: "/dashboard/settings/wallet", icon: Wallet },
      { label: "Billing History", href: "/dashboard/settings/billing-history", icon: Receipt },
      { label: "User Management", href: "/dashboard/settings/team", icon: Users },
      { label: "My Profile", href: "/dashboard/settings/profile", icon: UserCircle },
      { label: "Change Password", href: "/dashboard/settings/change-password", icon: Lock },
    ],
  },
];
