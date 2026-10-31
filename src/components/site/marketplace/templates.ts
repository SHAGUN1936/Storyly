// Marketplace tabs and how they map to template categories in the database.

export type MarketplaceCategory = "wedding" | "birthday" | "invitation" | "celebration";

/** Tabs of /marketplace: "" is All, the rest are /marketplace/<category>. */
export const MARKETPLACE_TABS: { path: "" | MarketplaceCategory; label: string }[] = [
  { path: "", label: "All" },
  { path: "wedding", label: "Wedding" },
  { path: "birthday", label: "Birthday" },
  { path: "invitation", label: "Invitation" },
  { path: "celebration", label: "Celebration" },
];

/** Database categories shown under each tab. */
export const TAB_CATEGORIES: Record<MarketplaceCategory, string[]> = {
  wedding: ["Wedding", "Couple"],
  birthday: ["Birthday"],
  invitation: ["Invitation"],
  celebration: ["Event", "Love", "Friendship", "Memories", "Greeting"],
};
