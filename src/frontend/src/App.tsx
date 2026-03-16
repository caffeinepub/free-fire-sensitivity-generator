import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Copy,
  Crosshair,
  Flame,
  Gauge,
  Loader2,
  LogIn,
  LogOut,
  MemoryStick,
  Move,
  Shield,
  Smartphone,
  Target,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AdminPanel from "./AdminPanel";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// ─── Types ───────────────────────────────────────────────────────────────────

type RamTier = "1-3" | "4-6" | "8+";
type Screen = "generator" | "results" | "buy";

interface Settings {
  dpi: number;
  fireSize: number;
  general: number;
  redDot: number;
  scope2x: number;
  scope4x: number;
  sniper: number;
  gyroscope: number;
  joystickSize: number;
  tier: string;
}

// ─── Device Detection & Settings Generation ──────────────────────────────────

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

const RAM_CONFIG: Record<
  RamTier,
  {
    dpiMult: number;
    sensBoost: number;
    fireRange: [number, number];
    joystickRange: [number, number];
  }
> = {
  "1-3": {
    dpiMult: 1.0,
    sensBoost: 60,
    fireRange: [30, 49],
    joystickRange: [42, 55],
  },
  "4-6": {
    dpiMult: 1.05,
    sensBoost: 30,
    fireRange: [45, 59],
    joystickRange: [50, 60],
  },
  "8+": {
    dpiMult: 0.68,
    sensBoost: 0,
    fireRange: [40, 54],
    joystickRange: [45, 58],
  },
};

function generateSettings(deviceName: string, ram: RamTier): Settings {
  const tier = detectTier(deviceName);
  const t = (hashString(deviceName) % 100) / 100;
  const cfg = RAM_CONFIG[ram];

  const tiers = {
    low: {
      dpi: [420, 550],
      general: [125, 145],
      redDot: [122, 140],
      scope2x: [120, 138],
      scope4x: [118, 135],
      sniper: [115, 130],
      gyro: [118, 135],
      label: "Low-End Device",
    },
    mid: {
      dpi: [480, 620],
      general: [135, 155],
      redDot: [130, 150],
      scope2x: [125, 145],
      scope4x: [120, 140],
      sniper: [118, 135],
      gyro: [122, 142],
      label: "Mid-Range Device",
    },
    high: {
      dpi: [620, 820],
      general: [145, 165],
      redDot: [140, 160],
      scope2x: [135, 155],
      scope4x: [128, 148],
      sniper: [122, 140],
      gyro: [130, 150],
      label: "High-End Device",
    },
    pro: {
      dpi: [860, 1000],
      general: [175, 200],
      redDot: [168, 192],
      scope2x: [160, 180],
      scope4x: [150, 170],
      sniper: [138, 158],
      gyro: [150, 170],
      label: "Pro / Flagship",
    },
    default: {
      dpi: [420, 500],
      general: [125, 142],
      redDot: [122, 138],
      scope2x: [120, 135],
      scope4x: [118, 132],
      sniper: [115, 130],
      gyro: [118, 135],
      label: "Standard Device",
    },
  };

  const d = tiers[tier];
  const rawDpi = lerp(d.dpi[0], d.dpi[1], t);
  const dpi = Math.max(1, Math.min(1000, Math.round(rawDpi * cfg.dpiMult)));

  const boosted = (min: number, max: number) =>
    Math.min(200, lerp(min, max, t) + cfg.sensBoost);

  return {
    dpi,
    fireSize: lerp(cfg.fireRange[0], cfg.fireRange[1], t),
    joystickSize: lerp(cfg.joystickRange[0], cfg.joystickRange[1], t),
    general: boosted(d.general[0], d.general[1]),
    redDot: boosted(d.redDot[0], d.redDot[1]),
    scope2x: boosted(d.scope2x[0], d.scope2x[1]),
    scope4x: boosted(d.scope4x[0], d.scope4x[1]),
    sniper: boosted(d.sniper[0], d.sniper[1]),
    gyroscope: boosted(d.gyro[0], d.gyro[1]),
    tier: d.label,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  max,
  icon,
  ocid,
  accent = "orange",
}: {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  ocid: string;
  accent?: "orange" | "red" | "blue";
}) {
  const pct = (value / max) * 100;
  const glowClass =
    accent === "red"
      ? "glow-red"
      : accent === "blue"
        ? "glow-blue"
        : "glow-orange";
  const barClass =
    accent === "red"
      ? "from-accent to-primary"
      : accent === "blue"
        ? "from-blue-400 to-cyan-400"
        : "from-primary to-yellow-400";
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
        <span className="text-muted-foreground text-sm ml-1">/ {max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

function SensCard({
  label,
  value,
  icon,
  ocid,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  ocid: string;
  delay: number;
}) {
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
      {RAM_OPTIONS.map((opt, i) => (
        <button
          type="button"
          key={opt.value}
          data-ocid={`ram.select.${i + 1}`}
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

function CreatorBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex justify-center py-8"
    >
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20">
        <Flame size={14} className="text-orange-400" />
        <span className="text-sm font-display font-semibold">
          <span className="text-yellow-400">Created</span>
          <span className="text-orange-400"> by </span>
          <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent font-bold">
            Zeeshan Assad
          </span>
        </span>
        <Flame size={14} className="text-pink-400" />
      </div>
    </motion.div>
  );
}

// ─── UPI Payment Card ─────────────────────────────────────────────────────────

interface UpiOptionProps {
  name: string;
  emoji: string;
  color: string;
  number: string;
  ocid: string;
}

function UpiOption({ name, emoji, color, number, ocid }: UpiOptionProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(number).then(() => {
      toast.success(`${number} copied!`);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border ${color} bg-card p-4 flex flex-col gap-3`}
      data-ocid={ocid}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="font-display font-bold text-foreground text-base">
            {name}
          </p>
          <p className="text-xs text-muted-foreground">UPI Payment</p>
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">Send Rs. 50 to</p>
        <p className="font-display font-bold text-xl text-primary tracking-widest">
          {number}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        data-ocid={`${ocid}.button`}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
      >
        <Copy size={12} />
        Copy Number
      </button>
    </motion.div>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────

function LoginScreen({ onAdminClick }: { onAdminClick: () => void }) {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center px-4">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6 glow-orange">
            <Flame size={36} className="text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-2">
            <span className="text-foreground">PREMIUM</span>
            <br />
            <span className="text-primary text-glow">FF SENSI</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Pro sensitivity settings for Free Fire
          </p>
        </div>

        <Card className="border-border/60 bg-card/90 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-center text-muted-foreground uppercase tracking-widest text-sm">
              Sign in to Continue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-center space-y-2">
              <Shield size={24} className="text-primary mx-auto" />
              <p className="text-sm text-foreground font-semibold">
                Secure Login
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sign in with Internet Identity — no password needed. Your
                identity is fully decentralized.
              </p>
            </div>

            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold uppercase tracking-widest glow-orange transition-all h-12 text-base"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Flame size={16} />
                  </motion.div>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  Sign In
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              1 free premium generation per day · Unlimited with Rs. 50
            </p>
          </CardContent>
        </Card>

        <CreatorBadge />

        {/* Hidden admin link */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={onAdminClick}
            className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            admin
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Screen: Generator ───────────────────────────────────────────────────────

function GeneratorScreen({
  onGenerate,
}: { onGenerate: (settings: Settings, deviceName: string) => void }) {
  const { clear, identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [input, setInput] = useState("");
  const [ram, setRam] = useState<RamTier>("4-6");

  const { data: canGenerate, isLoading: checkingLimit } = useQuery<boolean>({
    queryKey: ["canGenerateToday"],
    queryFn: async () => {
      if (!actor) return true;
      return actor.canGenerateToday();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const { data: isPaid } = useQuery<boolean>({
    queryKey: ["isCallerPaid"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerPaid();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const handleGenerate = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const settings = generateSettings(trimmed, ram);
    onGenerate(settings, trimmed);
  };

  const principal = `${identity?.getPrincipal().toString().slice(0, 12)}...`;

  // Show buy screen only if not paid and daily limit used
  if (!isPaid && (canGenerate === undefined || canGenerate === false)) {
    return <BuyScreen />;
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Flame size={22} className="text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide">
              FF<span className="text-primary">Sensi</span>
              <span className="ml-2 text-xs text-primary border border-primary/30 rounded px-1.5 py-0.5">
                PREMIUM
              </span>
            </span>
            {isPaid && (
              <span className="text-xs text-yellow-400 border border-yellow-400/30 rounded px-1.5 py-0.5 font-display">
                ✓ PAID
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {principal && (
              <span className="hidden sm:block text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                {principal}
              </span>
            )}
            <Button
              data-ocid="nav.secondary_button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground text-xs gap-1"
            >
              <LogOut size={14} />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-display font-semibold uppercase tracking-widest mb-6">
              <CheckCircle size={12} />
              {isPaid ? (
                <span>Unlimited Generations — Premium Active</span>
              ) : (
                <span>1 FREE Generation Remaining Today</span>
              )}
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-none mb-3">
              <span className="text-foreground">FREE FIRE</span>
              <br />
              <span className="text-primary text-glow">PREMIUM</span>
              <br />
              <span className="text-foreground">SENSI</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Enter your device name and RAM tier to unlock premium sensitivity,
              DPI, joystick size, and aim assist settings.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border/60 bg-card/90 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                  <Smartphone size={16} className="text-primary" />
                  Your Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-3">
                  <Input
                    data-ocid="device.input"
                    placeholder="e.g. Samsung S23, Redmi Note 12, iPhone 14"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGenerate();
                    }}
                    className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MemoryStick size={13} className="text-primary" />
                    <span className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground">
                      Select RAM
                    </span>
                  </div>
                  <RamSelector value={ram} onChange={setRam} />
                </div>

                <Button
                  data-ocid="generator.primary_button"
                  onClick={handleGenerate}
                  disabled={
                    !input.trim() || (checkingLimit && !isPaid) || isFetching
                  }
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold uppercase tracking-widest glow-orange h-12 text-base transition-all"
                >
                  <Flame size={16} className="mr-2" />
                  Generate Premium Sensi
                </Button>

                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Samsung S23",
                    "iPhone 14",
                    "Redmi Note 12",
                    "Asus ROG Phone",
                  ].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setInput(d)}
                      className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <CreatorBadge />
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Screen: Results ─────────────────────────────────────────────────────────

function ResultsScreen({
  settings,
  deviceName,
  onBack,
}: { settings: Settings; deviceName: string; onBack: () => void }) {
  const { actor } = useActor();

  const recordMutation = useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await actor.recordGeneration();
    },
  });

  // Record generation once on mount
  const [recorded, setRecorded] = useState(false);
  if (!recorded) {
    setRecorded(true);
    recordMutation.mutate();
  }

  const sensItems = [
    {
      label: "General",
      value: settings.general,
      icon: <Gauge size={16} />,
      ocid: "sensitivity.card.1",
      delay: 0,
    },
    {
      label: "Red Dot",
      value: settings.redDot,
      icon: <Crosshair size={16} />,
      ocid: "sensitivity.card.2",
      delay: 0.07,
    },
    {
      label: "2× Scope",
      value: settings.scope2x,
      icon: <Crosshair size={16} />,
      ocid: "sensitivity.card.3",
      delay: 0.14,
    },
    {
      label: "4× Scope",
      value: settings.scope4x,
      icon: <Crosshair size={16} />,
      ocid: "sensitivity.card.4",
      delay: 0.21,
    },
    {
      label: "Sniper",
      value: settings.sniper,
      icon: <Target size={16} />,
      ocid: "sensitivity.card.5",
      delay: 0.28,
    },
    {
      label: "Gyroscope",
      value: settings.gyroscope,
      icon: <Zap size={16} />,
      ocid: "sensitivity.card.6",
      delay: 0.35,
    },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      <header className="relative z-10 border-b border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Flame size={22} className="text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide">
              FF<span className="text-primary">Sensi</span>
              <span className="ml-2 text-xs text-primary border border-primary/30 rounded px-1.5 py-0.5">
                PREMIUM
              </span>
            </span>
          </div>
          <Button
            data-ocid="results.secondary_button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-border/60 text-muted-foreground hover:text-foreground text-xs"
          >
            ← New Device
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-10">
        <div className="max-w-4xl mx-auto" data-ocid="results.section">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
              Premium Settings —{" "}
              <span className="text-primary">{deviceName}</span>
            </span>
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-display">
              {settings.tier}
            </Badge>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </motion.div>

          {/* Big stat cards: DPI + Fire + Joystick */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Recommended DPI"
              value={settings.dpi}
              max={1000}
              ocid="dpi.card"
              icon={<Gauge size={18} />}
              accent="orange"
            />
            <StatCard
              label="Fire Button Size"
              value={settings.fireSize}
              max={100}
              ocid="fire.card"
              icon={<Flame size={18} />}
              accent="red"
            />
            <StatCard
              label="Joystick Size"
              value={settings.joystickSize}
              max={100}
              ocid="joystick.card"
              icon={<Move size={18} />}
              accent="blue"
            />
          </div>

          {/* Aim Assist badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3"
            data-ocid="aim.card"
          >
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <Target size={18} />
            </div>
            <div>
              <p className="font-display font-bold text-foreground uppercase tracking-widest text-sm">
                Aim Assist
              </p>
              <p className="text-primary font-semibold text-lg font-display">
                ON — Recommended
              </p>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-display font-bold uppercase tracking-widest">
                Active
              </span>
            </div>
          </motion.div>

          {/* Sensitivity grid */}
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Scope Sensitivities <span className="text-primary/60">(0–200)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {sensItems.map((item) => (
              <SensCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={item.icon}
                ocid={item.ocid}
                delay={item.delay}
              />
            ))}
          </div>

          {/* Pro tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-muted-foreground"
          >
            <span className="text-primary font-semibold">Pro Tip:</span> Apply
            under{" "}
            <span className="text-foreground">Settings → Sensitivity</span> in
            Free Fire. Set DPI in your device pointer settings. Adjust ±5 based
            on preference.
          </motion.div>

          <CreatorBadge />
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Screen: Buy Sensi ────────────────────────────────────────────────────────

function BuyScreen() {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const [txId, setTxId] = useState("");
  const [paid, setPaid] = useState(false);

  const PAYMENT_NUMBER = "9103007881";

  const submitTxMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.submitTransactionId(id);
    },
    onSuccess: () => {
      setPaid(true);
      toast.success(
        "Payment info received! Admin will activate within 24 hours.",
      );
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("already have a pending transaction")) {
        setPaid(true);
        toast.success(
          "You already submitted a transaction ID. Please wait for admin approval.",
        );
      } else {
        toast.error(msg || "Failed to submit. Please try again.");
      }
    },
  });

  const handlePaid = () => {
    if (!txId.trim()) {
      toast.error("Please enter your Transaction ID first.");
      return;
    }
    submitTxMutation.mutate(txId.trim());
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] bg-accent/8 pointer-events-none" />

      <header className="relative z-10 border-b border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Flame size={22} className="text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide">
              FF<span className="text-primary">Sensi</span>
              <span className="ml-2 text-xs text-primary border border-primary/30 rounded px-1.5 py-0.5">
                PREMIUM
              </span>
            </span>
          </div>
          <Button
            data-ocid="buy.secondary_button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground text-xs gap-1"
          >
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto" data-ocid="buy.section">
          {/* Limit used notice */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mb-5">
              <span className="text-3xl">⏰</span>
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">
              <span className="text-foreground">Daily Free</span>
              <br />
              <span
                className="text-accent"
                style={{ textShadow: "0 0 20px oklch(55% 0.9 5 / 0.6)" }}
              >
                Limit Used
              </span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              You've used your 1 free generation today. Come back tomorrow or
              buy unlimited access.
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-60">
              ⟳ Resets at midnight daily
            </p>
          </motion.div>

          {/* Premium offer card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 mb-6 glow-orange"
            data-ocid="buy.card"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-xl text-foreground uppercase tracking-wide">
                  Get Unlimited
                </h2>
                <h3 className="font-display font-bold text-3xl text-primary text-glow uppercase">
                  Premium Sensi
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Only</p>
                <p className="font-display font-bold text-4xl text-primary">
                  Rs. 50
                </p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
            </div>
            <ul className="space-y-2 mb-0">
              {[
                "Unlimited daily generations",
                "Premium sensitivity values",
                "Joystick + aim assist settings",
                "Priority device support",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle size={14} className="text-primary shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* UPI Payment options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
              Pay via UPI — Choose your app
            </h3>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
              data-ocid="buy.list"
            >
              <UpiOption
                name="Google Pay"
                emoji="🅖"
                color="border-green-500/30 hover:border-green-400/50"
                number={PAYMENT_NUMBER}
                ocid="buy.item.1"
              />
              <UpiOption
                name="PhonePe"
                emoji="📲"
                color="border-purple-500/30 hover:border-purple-400/50"
                number={PAYMENT_NUMBER}
                ocid="buy.item.2"
              />
              <UpiOption
                name="Paytm"
                emoji="💳"
                color="border-blue-500/30 hover:border-blue-400/50"
                number={PAYMENT_NUMBER}
                ocid="buy.item.3"
              />
            </div>

            {/* Transaction ID + confirm */}
            <AnimatePresence>
              {!paid ? (
                <motion.div
                  key="tx-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                  data-ocid="buy.dialog"
                >
                  <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      After sending Rs. 50 to{" "}
                      <span className="text-primary font-bold">
                        {PAYMENT_NUMBER}
                      </span>
                      , enter your Transaction ID below:
                    </p>
                    <Input
                      data-ocid="buy.input"
                      placeholder="Enter Transaction ID (e.g. TXN123456789)"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                    />
                    <Button
                      data-ocid="buy.submit_button"
                      onClick={handlePaid}
                      disabled={!txId.trim() || submitTxMutation.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold uppercase tracking-widest glow-orange h-11 transition-all"
                    >
                      {submitTxMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "✅ I've Paid — Contact Admin"
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tx-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center"
                  data-ocid="buy.success_state"
                >
                  <CheckCircle
                    size={32}
                    className="text-primary mx-auto mb-3"
                  />
                  <h4 className="font-display font-bold text-foreground text-lg mb-2">
                    Payment Received!
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Admin will activate your unlimited access within 24 hours.
                  </p>
                  <p className="mt-3 text-primary font-bold font-display text-lg">
                    Contact: {PAYMENT_NUMBER}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    WhatsApp or call this number for support
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tomorrow note */}
            <p className="text-center text-xs text-muted-foreground mt-5 opacity-60">
              💡 Come back tomorrow for your next free generation
            </p>
          </motion.div>

          <CreatorBadge />
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [screen, setScreen] = useState<Screen>("generator");
  const [results, setResults] = useState<{
    settings: Settings;
    deviceName: string;
  } | null>(null);
  const [showAdmin, setShowAdmin] = useState(
    () =>
      window.location.hash === "#admin" ||
      new URLSearchParams(window.location.search).get("page") === "admin",
  );

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  const handleGenerate = (settings: Settings, deviceName: string) => {
    setResults({ settings, deviceName });
    setScreen("results");
  };

  if (showAdmin) {
    return (
      <>
        <AdminPanel onExit={() => setShowAdmin(false)} />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <Flame size={32} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onAdminClick={() => setShowAdmin(true)} />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <>
      {/* Fixed Admin Button */}
      <div className="fixed top-3 right-3 z-50">
        <button
          type="button"
          data-ocid="admin.open_modal_button"
          onClick={() => setShowAdmin(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-semibold hover:bg-orange-500/30 transition-colors"
        >
          <Flame size={12} />
          Admin
        </button>
      </div>
      <AnimatePresence mode="wait">
        {screen === "results" && results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultsScreen
              settings={results.settings}
              deviceName={results.deviceName}
              onBack={() => setScreen("generator")}
            />
          </motion.div>
        ) : screen === "buy" ? (
          <motion.div
            key="buy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BuyScreen />
          </motion.div>
        ) : (
          <motion.div
            key="generator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GeneratorScreen onGenerate={handleGenerate} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster richColors position="top-center" />
    </>
  );
}
