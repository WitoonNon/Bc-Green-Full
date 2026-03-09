import {
  HomeIcon,
  SupportIcon,
  UserIcon,
  WrenchIcon,
  StatusIcon,
} from "@/components/icons";

export const navItems = [
  {
    href: "/home",
    icon: HomeIcon,
    labelKey: "nav.home",
    match: [{ path: "/home", exact: true }, { path: "/", exact: true }],
  },
  {
    href: "/tickets/new",
    icon: WrenchIcon,
    labelKey: "nav.repair",
    match: [{ path: "/tickets/new", exact: true }],
  },
  {
    href: "/tickets",
    icon: StatusIcon,
    labelKey: "nav.status",
    match: [{ path: "/tickets", exclude: ["/tickets/new"] }],
  },
  {
    href: "/help",
    icon: SupportIcon,
    labelKey: "nav.support",
    match: [{ path: "/help" }],
  },
  {
    href: "/profile",
    icon: UserIcon,
    labelKey: "nav.profile",
    match: [{ path: "/profile" }],
  },
] as const;

export type NavItem = (typeof navItems)[number];

type MatchRule = { path: string; exact?: boolean; exclude?: readonly string[] };

export function isNavActive(pathname: string, item: NavItem) {
  return item.match.some(({ path, exact, exclude }: MatchRule) => {
    if (exclude?.some((value) => pathname.startsWith(value))) {
      return false;
    }
    return exact ? pathname === path : pathname.startsWith(path);
  });
}
