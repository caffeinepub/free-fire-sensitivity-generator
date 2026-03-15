import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crosshair,
  Flame,
  Gauge,
  MemoryStick,
  Smartphone,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RamTier = "1-3" | "4-6" | "8+";

interface Settings {
  dpi: number;
  fireSize: number;
  general: number;
  redDot: number;
  scope2x: number;
  scope4x: number;
  sniper: number;
  gyroscope: number;
  tier: string;
}

// ─── Device Detection ────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

function detectTier(name: string): "low" | "mid" | "high" | "pro" | "default" {
  const n = name.toLowerCase();
  if (
    /samsung s2[2-9]|iphone 1[4-9]|asus rog|black shark|rog phone|redmagic|nubia red magic/.test(
      n,
    )
  )
    return "pro";
  if (/samsung s[0-9]|iphone|oneplus|mi 11|poco x|oppo find|find x/.test(n))
    return "high";
  if (
    /redmi note|samsung a3[0-9]|samsung a4[0-9]|samsung a5[0-9]|realme [5-9]|poco m|vivo v|oppo a[5-9]/.test(
      n,
    )
  )
    return "mid";
  if (
    /redmi [0-9]|samsung a1[0-9]|samsung a2[0-9]|nokia|motorola moto g|vivo y|realme [1-4]|tecno|infinix/.test(
      n,
    )
  )
    return "low";
  return "default";
}

// RAM multiplier: 8+ GB = smaller DPI, lower tiers = normal/higher DPI
const RAM_DPI_MULTIPLIER: Record<RamTier, number> = {
  "1-3": 1.0,
  "4-6": 1.05,
  "8+": 0.68,
};

// RAM sensitivity boost: lower RAM = higher sensitivity (above 130)
const RAM_SENSI_BOOST: Record<RamTier, number> = {
  "1-3": 60, // +60 boost so even low-tier devices exceed 130
  "4-6": 30,
  "8+": 0,
};

// RAM fire button size ranges: lower RAM = smaller fire button
const RAM_FIRE_SIZE: Record<RamTier, [number, number]> = {
  "1-3": [30, 49],
  "4-6": [45, 59],
  "8+": [40, 54],
};

function generateSettings(deviceName: string, ram: RamTier): Settings {
  const tier = detectTier(deviceName);
  const t = (hashString(deviceName) % 100) / 100;

  const tiers = {
    low: {
      dpi: [200, 350],
      general: [75, 90],
      redDot: [70, 85],
      scope2x: [65, 80],
      scope4x: [60, 75],
      sniper: [55, 70],
      gyro: [60, 75],
      label: "Low-End Device",
    },
    mid: {
      dpi: [400, 550],
      general: [100, 115],
      redDot: [95, 110],
      scope2x: [90, 105],
      scope4x: [85, 100],
      sniper: [75, 90],
      gyro: [80, 95],
      label: "Mid-Range Device",
    },
    high: {
      dpi: [600, 800],
      general: [130, 150],
      redDot: [125, 142],
      scope2x: [118, 135],
      scope4x: [110, 128],
      sniper: [100, 118],
      gyro: [112, 130],
      label: "High-End Device",
    },
    pro: {
      dpi: [850, 1000],
      general: [175, 200],
      redDot: [165, 188],
      scope2x: [155, 175],
      scope4x: [145, 165],
      sniper: [130, 150],
      gyro: [145, 165],
      label: "Pro / Flagship Device",
    },
    default: {
      dpi: [380, 420],
      general: [90, 105],
      redDot: [85, 100],
      scope2x: [80, 95],
      scope4x: [75, 90],
      sniper: [68, 82],
      gyro: [75, 90],
      label: "Standard Device",
    },
  };

  const cfg = tiers[tier];
  const rawDpi = lerp(cfg.dpi[0], cfg.dpi[1], t);
  const adjustedDpi = Math.max(
    1,
    Math.min(1000, Math.round(rawDpi * RAM_DPI_MULTIPLIER[ram])),
  );

  const boost = RAM_SENSI_BOOST[ram];

  function boosted(min: number, max: number): number {
    const val = lerp(min, max, t) + boost;
    return Math.min(200, val);
  }

  const fireSizeRange = RAM_FIRE_SIZE[ram];
  const fireSize = lerp(fireSizeRange[0], fireSizeRange[1], t);

  return {
    dpi: adjustedDpi,
    fireSize,
    general: boosted(cfg.general[0], cfg.general[1]),
    redDot: boosted(cfg.redDot[0], cfg.redDot[1]),
    scope2x: boosted(cfg.scope2x[0], cfg.scope2x[1]),
    scope4x: boosted(cfg.scope4x[0], cfg.scope4x[1]),
    sniper: boosted(cfg.sniper[0], cfg.sniper[1]),
    gyroscope: boosted(cfg.gyro[0], cfg.gyro[1]),
    tier: cfg.label,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface BigStatCardProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  icon: React.ReactNode;
  ocid: string;
  accent?: "orange" | "red";
}

function BigStatCard({
  label,
  value,
  max,
  unit,
  icon,
  ocid,
  accent = "orange",
}: BigStatCardProps) {
  const pct = (value / max) * 100;
  const glowClass = accent === "red" ? "glow-red" : "glow-orange";
  const barAccent =
    accent === "red" ? "from-accent to-primary" : "from-primary to-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      data-ocid={ocid}
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 ${glowClass}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-muted text-primary">{icon}</div>
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-display">
          {label}
        </span>
      </div>
      <div className="mb-1">
        <span className="text-5xl font-display font-bold text-primary text-glow">
          {value}
        </span>
        {unit && (
          <span className="text-muted-foreground text-sm ml-1">{unit}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-3">Range: 1–{max}</div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barAccent}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

interface SensitivityCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  ocid: string;
  delay: number;
}

function SensitivityCard({
  label,
  value,
  icon,
  ocid,
  delay,
}: SensitivityCardProps) {
  const pct = (value / 200) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      data-ocid={ocid}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary">{icon}</div>
        <span className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-3xl font-display font-bold text-foreground">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">/ 200</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// ─── RAM Selector ─────────────────────────────────────────────────────────────

const RAM_OPTIONS: { value: RamTier; label: string; desc: string }[] = [
  { value: "1-3", label: "1 – 3 GB", desc: "Budget" },
  { value: "4-6", label: "4 – 6 GB", desc: "Mid-Range" },
  { value: "8+", label: "8+ GB", desc: "High-End" },
];

function RamSelector({
  value,
  onChange,
}: { value: RamTier; onChange: (v: RamTier) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {RAM_OPTIONS.map((opt) => (
        <button
          type="button"
          key={opt.value}
          data-ocid={`ram.select.${opt.value === "1-3" ? "1" : opt.value === "4-6" ? "2" : "3"}`}
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center py-2.5 px-2 rounded-lg border text-center transition-all ${
            value === opt.value
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <span className="font-display font-bold text-sm">{opt.label}</span>
          <span className="text-xs mt-0.5 opacity-70">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [deviceName, setDeviceName] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [input, setInput] = useState("");
  const [ram, setRam] = useState<RamTier>("4-6");

  function handleGenerate() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setDeviceName(trimmed);
    setSettings(generateSettings(trimmed, ram));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleGenerate();
  }

  const sensitivityItems = settings
    ? [
        {
          label: "General",
          value: settings.general,
          icon: <Gauge size={16} />,
          ocid: "sensitivity.card.1",
        },
        {
          label: "Red Dot",
          value: settings.redDot,
          icon: <Crosshair size={16} />,
          ocid: "sensitivity.card.2",
        },
        {
          label: "2× Scope",
          value: settings.scope2x,
          icon: <Crosshair size={16} />,
          ocid: "sensitivity.card.3",
        },
        {
          label: "4× Scope",
          value: settings.scope4x,
          icon: <Crosshair size={16} />,
          ocid: "sensitivity.card.4",
        },
        {
          label: "AWM / Sniper",
          value: settings.sniper,
          icon: <Crosshair size={16} />,
          ocid: "sensitivity.card.5",
        },
        {
          label: "Gyroscope",
          value: settings.gyroscope,
          icon: <Zap size={16} />,
          ocid: "sensitivity.card.6",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      {/* Ambient top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <Flame size={22} className="text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-foreground">
            FF<span className="text-primary">Sensitivity</span>
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-display font-semibold uppercase tracking-widest mb-6">
              <Flame size={12} />
              Free Fire Pro Settings
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-none mb-4">
              <span className="text-foreground">FREE FIRE</span>
              <br />
              <span className="text-primary text-glow">SENSITIVITY</span>
              <br />
              <span className="text-foreground">GENERATOR</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Enter your device name and RAM to get personalized DPI, fire
              button size, and scope sensitivity settings optimized for your
              hardware.
            </p>
          </motion.div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto mb-14"
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                  <Smartphone size={16} className="text-primary" />
                  Your Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    data-ocid="device.input"
                    placeholder="e.g. Samsung S23, iPhone 14, Redmi Note 12"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 font-body"
                  />
                  <Button
                    data-ocid="device.submit_button"
                    onClick={handleGenerate}
                    disabled={!input.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold uppercase tracking-wide shrink-0 glow-orange transition-all"
                  >
                    Generate
                  </Button>
                </div>

                {/* RAM selector */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MemoryStick size={13} className="text-primary" />
                    <span className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground">
                      Select RAM
                    </span>
                  </div>
                  <RamSelector value={ram} onChange={setRam} />
                </div>

                {deviceName && settings && (
                  <p className="text-xs text-muted-foreground">
                    Detected:{" "}
                    <span className="text-primary font-semibold">
                      {settings.tier}
                    </span>
                    {" · "}
                    RAM:{" "}
                    <span className="text-primary font-semibold">{ram} GB</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {settings && (
              <motion.section
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                data-ocid="results.section"
              >
                {/* Section title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                  <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
                    Recommended Settings for —{" "}
                    <span className="text-primary">{deviceName}</span>
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                </motion.div>

                {/* DPI + Fire Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <BigStatCard
                    label="Recommended DPI"
                    value={settings.dpi}
                    max={1000}
                    ocid="dpi.card"
                    icon={<Gauge size={18} />}
                    accent="orange"
                  />
                  <BigStatCard
                    label="Fire Button Size"
                    value={settings.fireSize}
                    max={100}
                    ocid="fire.card"
                    icon={<Flame size={18} />}
                    accent="red"
                  />
                </div>

                {/* Sensitivity cards */}
                <h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Scope Sensitivity Settings{" "}
                  <span className="text-primary/60">(0–200)</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sensitivityItems.map((item, i) => (
                    <SensitivityCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      icon={item.icon}
                      ocid={item.ocid}
                      delay={i * 0.07}
                    />
                  ))}
                </div>

                {/* Pro tip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-muted-foreground"
                >
                  <span className="text-primary font-semibold">Pro Tip:</span>{" "}
                  Apply these settings in Free Fire under{" "}
                  <span className="text-foreground">
                    Settings → Sensitivity
                  </span>
                  . Adjust DPI in your device's pointer/touch settings or a
                  dedicated gaming app. Fine-tune ±5 based on personal
                  preference.
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!settings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <Crosshair size={32} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Enter your device name above to generate settings
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "Samsung S23",
                  "iPhone 14",
                  "Redmi Note 12",
                  "Asus ROG Phone",
                ].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => {
                      setInput(d);
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-4 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>Settings optimized for Free Fire — adjust to your playstyle.</p>
          <p>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
