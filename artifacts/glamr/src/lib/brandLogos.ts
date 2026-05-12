export const BRAND_DOMAINS: Record<string, string> = {
  // Eyelash brands
  "ardell": "ardellbeauty.com",
  "lilly lashes": "lillylashes.com",
  "velour lashes": "velourbeauty.com",
  "velour": "velourbeauty.com",
  "eylure": "eylure.com",
  "house of lashes": "houseoflashes.com",
  "kiss": "kissusa.com",
  "sephora collection": "sephora.com",
  "tatti lashes": "tattilashes.com",
  "doe lashes": "doelashes.com",
  "glamnetic": "glamnetic.com",
  "charlotte tilbury": "charlottetilbury.com",
  "nars": "narscosmetics.com",
  "mac cosmetics": "maccosmetics.com",
  "mac": "maccosmetics.com",
  "fenty beauty": "fentybeauty.com",
  "urban decay": "urbandecay.com",
  "pat mcgrath labs": "patmcgrath.com",
  "pat mcgrath": "patmcgrath.com",
  "anastasia beverly hills": "anastasiabeverlyhills.com",
  "huda beauty": "hudabeauty.com",
  "rare beauty": "rarebeauty.com",
  "dior beauty": "dior.com",
  "dior": "dior.com",
  "chanel beauty": "chanel.com",
  "chanel": "chanel.com",
  "ysl beauty": "yslbeautyus.com",
  "ysl": "yslbeautyus.com",
  "hourglass": "hourglasscosmetics.com",
  "milk makeup": "milkmakeup.com",
  "too faced": "toofaced.com",
  "laura mercier": "lauramercier.com",
  "bobbi brown": "bobbibrowncosmetics.com",
  "benefit": "benefitcosmetics.com",
  "tower28": "tower28beauty.com",
  "tower 28": "tower28beauty.com",
  "kylie cosmetics": "kyliecosmetics.com",
  "natasha denona": "natashadenona.com",
  "dragun beauty": "dragunbeauty.com",
  "morphe": "morphe.com",
  "uoma beauty": "uomabeauty.com",
  "lorac": "loraccosmetics.com",
  "danessa myricks beauty": "danessamyricksbeauty.com",
  "danessa myricks": "danessamyricksbeauty.com",
  "tarte": "tartecosmetics.com",
  "stila": "stilacosmetics.com",
};

export function getBrandLogo(name: string): string | null {
  const key = name.trim().toLowerCase();
  const domain = BRAND_DOMAINS[key];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

export function getBrandInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join("");
}
