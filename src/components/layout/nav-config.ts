export type NavLeaf = { label: string; href: string; badge?: string };
export type NavGroup = { label: string; items: NavLeaf[] };

export const NAV_TOP: NavLeaf[] = [
  { label: "Dashboard", href: "/dashboard" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Creative Studio",
    items: [
      { label: "Create Images", href: "/dashboard/studio" },
      { label: "Create Videos", href: "/dashboard/studio/videos" },
    ],
  },
  {
    label: "Content Calendar",
    items: [
      { label: "Scheduler", href: "/dashboard/scheduler" },
      { label: "Content Planning", href: "/dashboard/content-planning" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "My API Keys", href: "/dashboard/settings/api-keys" },
      { label: "Social Media Accounts", href: "/dashboard/settings/social-accounts" },
      { label: "Brand Kit", href: "/dashboard/brand-kit" },
      { label: "Subscription", href: "/dashboard/settings/subscription" },
      { label: "Wallet", href: "/dashboard/settings/wallet" },
      { label: "Billing History", href: "/dashboard/settings/billing-history" },
      { label: "User Management", href: "/dashboard/settings/team" },
      { label: "My Profile", href: "/dashboard/settings/profile" },
      { label: "Change Password", href: "/dashboard/settings/change-password" },
    ],
  },
];
