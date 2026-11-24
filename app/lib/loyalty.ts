export type TierCode =
  | "basic"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";
export type LoyaltyData = {
  environment: "sandbox";
  version: number;
  tiers: { code: TierCode; minXp: string; maxXp: string | null }[];
  player: {
    xp: string;
    tier: TierCode;
    nextTier: TierCode | null;
    xpToNext: string;
    progressPercent: number;
  } | null;
};
