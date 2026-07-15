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
    label: "Settings",
    icon: KeyRound,
    items: [
      { label: "My API Keys", href: "/dashboard/settings/api-keys", icon: KeyRound },
      { label: "Social Media Accounts", href: "/dashboard/settings/social-accounts", icon: Share2 },
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
