import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Avatar {
  id: string;
  nationality: string;
  country: string;
  flag: string;
  region: string;
  skinHex: string;
  hairHex: string;
  eyeHex: string;
  lipHex: string;
  description: string;
}

export const AVATARS: Avatar[] = [
  // East Asia
  { id: "japan",       nationality: "Japanese",       country: "Japan",       flag: "🇯🇵", region: "East Asia",       skinHex: "#f5e8d8", hairHex: "#1a1a1a", eyeHex: "#2a1a08", lipHex: "#e8a8a0", description: "Fair, porcelain-toned skin" },
  { id: "korea",       nationality: "Korean",         country: "South Korea", flag: "🇰🇷", region: "East Asia",       skinHex: "#f0e0d0", hairHex: "#0d0d0d", eyeHex: "#1a1808", lipHex: "#e89898", description: "Clear, dewy-toned skin" },
  { id: "china",       nationality: "Chinese",        country: "China",       flag: "🇨🇳", region: "East Asia",       skinHex: "#f0dcc8", hairHex: "#101010", eyeHex: "#1a1a10", lipHex: "#e0a090", description: "Warm, golden-toned skin" },
  { id: "taiwan",      nationality: "Taiwanese",      country: "Taiwan",      flag: "🇹🇼", region: "East Asia",       skinHex: "#f0e0c8", hairHex: "#1a1008", eyeHex: "#1a1208", lipHex: "#e09888", description: "Warm, light tan skin" },
  // Southeast Asia
  { id: "philippines", nationality: "Filipino",       country: "Philippines", flag: "🇵🇭", region: "Southeast Asia",  skinHex: "#d4a870", hairHex: "#100a00", eyeHex: "#1a1000", lipHex: "#c87858", description: "Warm, morena golden skin" },
  { id: "thailand",    nationality: "Thai",           country: "Thailand",    flag: "🇹🇭", region: "Southeast Asia",  skinHex: "#d8b080", hairHex: "#0a0808", eyeHex: "#180e00", lipHex: "#d09070", description: "Warm, sun-touched skin" },
  { id: "vietnam",     nationality: "Vietnamese",     country: "Vietnam",     flag: "🇻🇳", region: "Southeast Asia",  skinHex: "#e0c898", hairHex: "#080808", eyeHex: "#100800", lipHex: "#c89080", description: "Light-medium, warm skin" },
  { id: "indonesia",   nationality: "Indonesian",     country: "Indonesia",   flag: "🇮🇩", region: "Southeast Asia",  skinHex: "#c89868", hairHex: "#080600", eyeHex: "#1a0e00", lipHex: "#c07858", description: "Medium warm, tropical skin" },
  { id: "malaysia",    nationality: "Malaysian",      country: "Malaysia",    flag: "🇲🇾", region: "Southeast Asia",  skinHex: "#c09070", hairHex: "#080808", eyeHex: "#180c00", lipHex: "#b87858", description: "Warm, light-medium skin" },
  { id: "singapore",   nationality: "Singaporean",   country: "Singapore",   flag: "🇸🇬", region: "Southeast Asia",  skinHex: "#e0c090", hairHex: "#0d0800", eyeHex: "#180e08", lipHex: "#c89080", description: "Diverse skin tones" },
  // South Asia
  { id: "india",       nationality: "Indian",         country: "India",       flag: "🇮🇳", region: "South Asia",      skinHex: "#c89070", hairHex: "#0d0808", eyeHex: "#1a0e08", lipHex: "#b87048", description: "Warm, diverse South Asian skin" },
  { id: "pakistan",    nationality: "Pakistani",      country: "Pakistan",    flag: "🇵🇰", region: "South Asia",      skinHex: "#d4a880", hairHex: "#0d0808", eyeHex: "#1a1008", lipHex: "#c08068", description: "Warm, olive-tan skin" },
  { id: "bangladesh",  nationality: "Bangladeshi",   country: "Bangladesh",  flag: "🇧🇩", region: "South Asia",      skinHex: "#c89068", hairHex: "#080808", eyeHex: "#180c08", lipHex: "#b87060", description: "Warm, medium golden skin" },
  { id: "srilanka",    nationality: "Sri Lankan",     country: "Sri Lanka",   flag: "🇱🇰", region: "South Asia",      skinHex: "#b87848", hairHex: "#080608", eyeHex: "#100a00", lipHex: "#a86848", description: "Rich, warm golden skin" },
  // Middle East
  { id: "saudi",       nationality: "Saudi",          country: "Saudi Arabia",flag: "🇸🇦", region: "Middle East",     skinHex: "#d8b080", hairHex: "#080808", eyeHex: "#1a0e08", lipHex: "#c09070", description: "Warm, olive Mediterranean skin" },
  { id: "iran",        nationality: "Iranian",        country: "Iran",        flag: "🇮🇷", region: "Middle East",     skinHex: "#d8c0a0", hairHex: "#101008", eyeHex: "#1a1808", lipHex: "#c09080", description: "Light olive, warm skin" },
  { id: "turkey",      nationality: "Turkish",        country: "Turkey",      flag: "🇹🇷", region: "Middle East",     skinHex: "#d8c0a0", hairHex: "#101010", eyeHex: "#1a1a10", lipHex: "#c09888", description: "Light-medium, olive skin" },
  { id: "uae",         nationality: "Emirati",        country: "UAE",         flag: "🇦🇪", region: "Middle East",     skinHex: "#c8a070", hairHex: "#080808", eyeHex: "#100a00", lipHex: "#b08060", description: "Warm olive, Gulf skin" },
  // Africa
  { id: "nigeria",     nationality: "Nigerian",       country: "Nigeria",     flag: "🇳🇬", region: "West Africa",     skinHex: "#5a2808", hairHex: "#080808", eyeHex: "#080400", lipHex: "#7a3818", description: "Deep, rich melanin-rich skin" },
  { id: "ghana",       nationality: "Ghanaian",       country: "Ghana",       flag: "🇬🇭", region: "West Africa",     skinHex: "#6a3010", hairHex: "#080808", eyeHex: "#080400", lipHex: "#8a4820", description: "Deep, warm ebony skin" },
  { id: "kenya",       nationality: "Kenyan",         country: "Kenya",       flag: "🇰🇪", region: "East Africa",     skinHex: "#4a2008", hairHex: "#050505", eyeHex: "#080400", lipHex: "#6a3010", description: "Deep, rich warm skin" },
  { id: "ethiopia",    nationality: "Ethiopian",      country: "Ethiopia",    flag: "🇪🇹", region: "East Africa",     skinHex: "#5a2810", hairHex: "#080808", eyeHex: "#080400", lipHex: "#7a4020", description: "Deep, luminous skin" },
  { id: "southafrica", nationality: "South African",  country: "South Africa",flag: "🇿🇦", region: "Southern Africa", skinHex: "#6a3818", hairHex: "#080808", eyeHex: "#080600", lipHex: "#8a4828", description: "Diverse, warm skin tones" },
  { id: "egypt",       nationality: "Egyptian",       country: "Egypt",       flag: "🇪🇬", region: "North Africa",    skinHex: "#c8a070", hairHex: "#0d0a08", eyeHex: "#1a1408", lipHex: "#b08868", description: "Warm, Mediterranean tan skin" },
  { id: "morocco",     nationality: "Moroccan",       country: "Morocco",     flag: "🇲🇦", region: "North Africa",    skinHex: "#c0985a", hairHex: "#0d0a08", eyeHex: "#180e08", lipHex: "#a87848", description: "Warm, olive-tan skin" },
  // Europe
  { id: "uk",          nationality: "British",        country: "UK",          flag: "🇬🇧", region: "Western Europe",  skinHex: "#f8e8e0", hairHex: "#3a2010", eyeHex: "#406080", lipHex: "#e0a8a8", description: "Fair, cool-toned skin" },
  { id: "france",      nationality: "French",         country: "France",      flag: "🇫🇷", region: "Western Europe",  skinHex: "#f5e0d0", hairHex: "#3a2808", eyeHex: "#406878", lipHex: "#e0a898", description: "Light, natural warm skin" },
  { id: "italy",       nationality: "Italian",        country: "Italy",       flag: "🇮🇹", region: "Southern Europe", skinHex: "#e8d0a8", hairHex: "#2a1808", eyeHex: "#3a2808", lipHex: "#d09880", description: "Warm, golden Mediterranean skin" },
  { id: "spain",       nationality: "Spanish",        country: "Spain",       flag: "🇪🇸", region: "Southern Europe", skinHex: "#e8c898", hairHex: "#2a1808", eyeHex: "#382808", lipHex: "#d09080", description: "Warm, olive Southern European skin" },
  { id: "germany",     nationality: "German",         country: "Germany",     flag: "🇩🇪", region: "Western Europe",  skinHex: "#f8e8e0", hairHex: "#c8a860", eyeHex: "#406878", lipHex: "#e0a8a0", description: "Fair, cool Northern European skin" },
  { id: "russia",      nationality: "Russian",        country: "Russia",      flag: "🇷🇺", region: "Eastern Europe",  skinHex: "#f8e8e0", hairHex: "#3a2010", eyeHex: "#405878", lipHex: "#e0a8a8", description: "Pale, cool Northern skin" },
  { id: "greece",      nationality: "Greek",          country: "Greece",      flag: "🇬🇷", region: "Southern Europe", skinHex: "#e0c898", hairHex: "#1a1008", eyeHex: "#1a1808", lipHex: "#d09080", description: "Mediterranean warm skin" },
  { id: "poland",      nationality: "Polish",         country: "Poland",      flag: "🇵🇱", region: "Eastern Europe",  skinHex: "#f5e8e0", hairHex: "#8a6040", eyeHex: "#406878", lipHex: "#e0a8a0", description: "Fair, light Northern skin" },
  // Americas
  { id: "usa",         nationality: "American",       country: "USA",         flag: "🇺🇸", region: "North America",   skinHex: "#e8d0b8", hairHex: "#5a3818", eyeHex: "#407060", lipHex: "#d09888", description: "Diverse; warm medium skin" },
  { id: "canada",      nationality: "Canadian",       country: "Canada",      flag: "🇨🇦", region: "North America",   skinHex: "#f0e0d0", hairHex: "#6a4828", eyeHex: "#406878", lipHex: "#d8a8a0", description: "Light-medium diverse skin" },
  { id: "brazil",      nationality: "Brazilian",      country: "Brazil",      flag: "🇧🇷", region: "South America",   skinHex: "#c8a070", hairHex: "#1a0d08", eyeHex: "#2a1808", lipHex: "#c08868", description: "Warm, sun-kissed diverse skin" },
  { id: "mexico",      nationality: "Mexican",        country: "Mexico",      flag: "🇲🇽", region: "Central America", skinHex: "#c8986a", hairHex: "#100808", eyeHex: "#1a1008", lipHex: "#b87858", description: "Warm, medium Mestizo skin" },
  { id: "colombia",    nationality: "Colombian",      country: "Colombia",    flag: "🇨🇴", region: "South America",   skinHex: "#c09870", hairHex: "#100a08", eyeHex: "#2a1808", lipHex: "#b07858", description: "Warm, diverse Caribbean skin" },
  { id: "argentina",   nationality: "Argentinian",    country: "Argentina",   flag: "🇦🇷", region: "South America",   skinHex: "#e8d0b0", hairHex: "#382010", eyeHex: "#3a3020", lipHex: "#c8a090", description: "Light, warm European-heritage skin" },
  // Oceania
  { id: "australia",   nationality: "Australian",     country: "Australia",   flag: "🇦🇺", region: "Oceania",         skinHex: "#f0d8c0", hairHex: "#b08040", eyeHex: "#406878", lipHex: "#d8a888", description: "Light-medium, sun-bronzed skin" },
  { id: "newzealand",  nationality: "New Zealander",  country: "New Zealand", flag: "🇳🇿", region: "Oceania",         skinHex: "#e8d0b8", hairHex: "#3a2010", eyeHex: "#406878", lipHex: "#d0a888", description: "Light to medium Māori/Pākehā" },
];

const REGIONS = [...new Set(AVATARS.map(a => a.region))].sort();

interface AvatarFaceProps {
  avatar: Avatar;
  size?: number;
  selected?: boolean;
  showMakeup?: boolean;
}

function AvatarFace({ avatar, size = 80, selected = false, showMakeup = false }: AvatarFaceProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
      {/* Face oval */}
      <ellipse cx={cx} cy={cy + 4} rx={s * 0.38} ry={s * 0.44} fill={avatar.skinHex} />
      {/* Neck */}
      <rect x={cx - s * 0.12} y={cy + s * 0.35} width={s * 0.24} height={s * 0.14} fill={avatar.skinHex} />
      {/* Hair */}
      <ellipse cx={cx} cy={cy - s * 0.28} rx={s * 0.42} ry={s * 0.24} fill={avatar.hairHex} />
      <rect x={cx - s * 0.42} y={cy - s * 0.28} width={s * 0.84} height={s * 0.2} fill={avatar.hairHex} />
      {/* Side hair */}
      <ellipse cx={cx - s * 0.34} cy={cy + s * 0.1} rx={s * 0.09} ry={s * 0.22} fill={avatar.hairHex} />
      <ellipse cx={cx + s * 0.34} cy={cy + s * 0.1} rx={s * 0.09} ry={s * 0.22} fill={avatar.hairHex} />

      {/* Eyes */}
      {/* Left eye */}
      <ellipse cx={cx - s * 0.13} cy={cy - s * 0.02} rx={s * 0.085} ry={s * 0.055} fill="white" />
      <ellipse cx={cx - s * 0.13} cy={cy - s * 0.02} rx={s * 0.05} ry={s * 0.046} fill={avatar.eyeHex} />
      <ellipse cx={cx - s * 0.13} cy={cy - s * 0.02} rx={s * 0.025} ry={s * 0.025} fill="#0a0808" />
      {/* Right eye */}
      <ellipse cx={cx + s * 0.13} cy={cy - s * 0.02} rx={s * 0.085} ry={s * 0.055} fill="white" />
      <ellipse cx={cx + s * 0.13} cy={cy - s * 0.02} rx={s * 0.05} ry={s * 0.046} fill={avatar.eyeHex} />
      <ellipse cx={cx + s * 0.13} cy={cy - s * 0.02} rx={s * 0.025} ry={s * 0.025} fill="#0a0808" />

      {/* Eyebrows */}
      <path d={`M ${cx - s*0.21} ${cy - s*0.1} Q ${cx - s*0.13} ${cy - s*0.14} ${cx - s*0.04} ${cy - s*0.1}`} stroke={avatar.hairHex} strokeWidth={s * 0.025} fill="none" strokeLinecap="round" />
      <path d={`M ${cx + s*0.04} ${cy - s*0.1} Q ${cx + s*0.13} ${cy - s*0.14} ${cx + s*0.21} ${cy - s*0.1}`} stroke={avatar.hairHex} strokeWidth={s * 0.025} fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx={cx - s * 0.04} cy={cy + s * 0.1} rx={s * 0.025} ry={s * 0.015} fill={avatar.skinHex} stroke={avatar.hairHex} strokeWidth={s * 0.01} fillOpacity="0.8" />
      <ellipse cx={cx + s * 0.04} cy={cy + s * 0.1} rx={s * 0.025} ry={s * 0.015} fill={avatar.skinHex} stroke={avatar.hairHex} strokeWidth={s * 0.01} fillOpacity="0.8" />

      {/* Lips */}
      <path d={`M ${cx - s*0.1} ${cy + s*0.2} Q ${cx} ${cy + s*0.17} ${cx + s*0.1} ${cy + s*0.2}`} stroke={avatar.lipHex} strokeWidth={s * 0.018} fill="none" strokeLinecap="round" />
      <ellipse cx={cx} cy={cy + s * 0.23} rx={s * 0.1} ry={s * 0.038} fill={avatar.lipHex} fillOpacity="0.85" />

      {showMakeup && (
        <>
          {/* Blush circles */}
          <ellipse cx={cx - s * 0.26} cy={cy + s * 0.05} rx={s * 0.09} ry={s * 0.055} fill={avatar.lipHex} fillOpacity="0.3" />
          <ellipse cx={cx + s * 0.26} cy={cy + s * 0.05} rx={s * 0.09} ry={s * 0.055} fill={avatar.lipHex} fillOpacity="0.3" />
        </>
      )}

      {/* Selection ring */}
      {selected && (
        <ellipse cx={cx} cy={cy + 4} rx={s * 0.45} ry={s * 0.48} fill="none" stroke="hsl(var(--primary))" strokeWidth={s * 0.04} />
      )}
    </svg>
  );
}

interface AvatarSelectorProps {
  selectedId: string | null;
  onSelect: (avatar: Avatar | null) => void;
  onClose: () => void;
}

export function AvatarSelector({ selectedId, onSelect, onClose }: AvatarSelectorProps) {
  const [region, setRegion] = useState<string>("All");

  const filtered = region === "All"
    ? AVATARS
    : AVATARS.filter(a => a.region === region);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl font-bold">Choose Your Avatar</h2>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-3 border-b border-border shrink-0">
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...REGIONS].map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                region === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:border-border"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Scan option */}
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all mb-3 ${
            selectedId === null
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <span className="text-2xl">📷</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Use My Face</p>
            <p className="text-xs text-muted-foreground">Scan your face and your avatar will look like you</p>
          </div>
          {selectedId === null && <Check className="w-5 h-5 text-primary ml-auto" />}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {filtered.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => { onSelect(avatar); onClose(); }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                selectedId === avatar.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <AvatarFace avatar={avatar} size={52} selected={selectedId === avatar.id} showMakeup />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-base">{avatar.flag}</span>
                  <p className="font-semibold text-xs leading-tight">{avatar.nationality}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{avatar.description}</p>
              </div>
              {selectedId === avatar.id && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export { AvatarFace };
export type { AvatarFaceProps };
