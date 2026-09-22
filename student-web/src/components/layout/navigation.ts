import type { UserRole } from "../../types/api";

export type NavGroup = "Main" | "Academic" | "My records" | "Account";

export interface NavItem {
  to: string;
  label: string;
  /** Exact match (used for index routes). */
  end?: boolean;
  group: NavGroup;
  /**
   * Roles allowed to see this link, mirroring the backend's policy matrix
   * (docs/API-CONTRACT.md §4). Students are refused by every list endpoint except
   * their own portal routes, which is why they get a separate group.
   */
  roles: UserRole[];
}

/** The four roles the backend implements (see User::ROLE_* and the seed data). */
export const ALL_ROLES: UserRole[] = ["admin", "registrar", "instructor", "student"];
export const ALL_STAFF: UserRole[] = ["admin", "registrar"];
export const STAFF_AND_INSTRUCTOR: UserRole[] = ["admin", "registrar", "instructor"];

/**
 * Single source of truth for the navigation. The layout filters this list by the
 * signed-in user's role, and the router uses the same role lists for its guards -
 * so a link that is hidden is also a route that refuses a direct visit.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", end: true, group: "Main", roles: ALL_ROLES },
  { to: "/programs", label: "Programs", group: "Academic", roles: STAFF_AND_INSTRUCTOR },
  { to: "/courses", label: "Courses", group: "Academic", roles: STAFF_AND_INSTRUCTOR },
  {
    to: "/academic-terms",
    label: "Academic Terms",
    group: "Academic",
    roles: STAFF_AND_INSTRUCTOR
  },
  { to: "/students", label: "Students", group: "Academic", roles: ALL_STAFF },
  {
    to: "/course-offerings",
    label: "Course Offerings",
    group: "Academic",
    roles: STAFF_AND_INSTRUCTOR
  },
  { to: "/enrollments", label: "Enrollments", group: "Academic", roles: STAFF_AND_INSTRUCTOR },
  { to: "/grades", label: "Grades", group: "Academic", roles: STAFF_AND_INSTRUCTOR },
  { to: "/portal", label: "My Profile", end: true, group: "My records", roles: ["student"] },
  { to: "/portal/enrollments", label: "My Enrollments", group: "My records", roles: ["student"] },
  { to: "/portal/grades", label: "My Grades", group: "My records", roles: ["student"] },
  {
    to: "/portal/academic-record",
    label: "My Academic Record",
    group: "My records",
    roles: ["student"]
  },
  { to: "/account", label: "My Account", group: "Account", roles: ALL_ROLES }
];

/** The order groups appear in the sidebar. */
const GROUP_ORDER: NavGroup[] = ["Main", "Academic", "My records", "Account"];

/** The items a given role may see. */
export function navItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) {
    return [];
  }

  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export interface NavSection {
  title: NavGroup;
  items: NavItem[];
}

/** Groups visible items for the sidebar, dropping empty groups. */
export function groupNavItems(items: NavItem[]): NavSection[] {
  return GROUP_ORDER.map((title) => ({
    title,
    items: items.filter((item) => item.group === title)
  })).filter((section) => section.items.length > 0);
}
