import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  Crosshair,
  Eye,
  Flame,
  Hand,
  Loader2,
  Smartphone,
  Target,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SensitivityProfile } from "./backend.d";
import { useGetSensitivity } from "./hooks/useQueries";

const queryClient = new QueryClient();

const DPI_OPTIONS = [120, 240, 360, 480, 600];
const DEFAULT_DPI = 240;

const EMBER_PARTICLES = [
  { id: "e1", size: 6, left: 10, top: 20, hue: 50, delay: 0 },
  { id: "e2", size: 9, left: 25, top: 40, hue: 55, delay: 0.5 },
  { id: "e3", size: 12, left: 40, top: 20, hue: 60, delay: 1.0 },
  { id: "e4", size: 15, left: 55, top: 40, hue: 65, delay: 1.5 },
  { id: "e5", size: 18, left: 70, top: 20, hue: 70, delay: 2.0 },
  { id: "e6", size: 21, left: 85, top: 40, hue: 75, delay: 2.5 },
];

function scaleValue(raw: bigint, dpi: number): number {
  const scaled = Math.round(Number(raw) * (DEFAULT_DPI / dpi));
  return Math.min(200, Math.max(1, scaled));
}

function getFireButtonRecommendation(deviceTier: string): {
  size: string;
  reason: string;
} {
  const tier = deviceTier.toLowerCase();
  if (tier.includes("low")) {
    return {
      size: "Large",
      reason: "Bigger buttons reduce mis-taps on smaller or slower screens.",
    };
  }
  if (tier.includes("high")) {
    return {
      size: "Small",
      reason:
        "Smaller buttons free up screen space for better visibility and precision.",
    };
  }
  return {
    size: "Medium",
    reason: "A balanced size for smooth performance on mid-range devices.",
  };
}

function SensitivityApp() {
  const [deviceName, setDeviceName] = useState("");
  const [result, setResult] = useState<SensitivityProfile | null>(null);
  const [selectedDpi, setSelectedDpi] = useState(DEFAULT_DPI);
  const { mutate, isPending, isError, error } = useGetSensitivity();

  function handleGenerate() {
    const trimmed = deviceName.trim();
    if (!trimmed) {
      toast.error("Please enter your device name");
      return;
    }
    mutate(trimmed, {
      onSuccess: (data) => {
        setResult(data);
        toast.success("Sensitivity generated!");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to generate sensitivity");
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleGenerate();
  }

  const tierLabel = result?.deviceTier ?? "";
  const tierClass = tierLabel.toLowerCase().includes("low")
    ? "tier-low"
    : tierLabel.toLowerCase().includes("high")
      ? "tier-high"
      : "tier-mid";

  const fireButton = result
    ? getFireButtonRecommendation(result.deviceTier)
    : null;

  const sensitivityCards = result
    ? [
        {
          label: "General",
          value: scaleValue(result.general, selectedDpi),
          icon: <Zap className="w-5 h-5" />,
          delay: 0,
        },
        {
          label: "Red Dot",
          value: scaleValue(result.redDot, selectedDpi),
          icon: <Target className="w-5 h-5" />,
          delay: 0.05,
        },
        {
          label: "2x Scope",
          value: scaleValue(result.scope2x, selectedDpi),
          icon: <Crosshair className="w-5 h-5" />,
          delay: 0.1,
        },
        {
          label: "4x Scope",
          value: scaleValue(result.scope4x, selectedDpi),
          icon: <Crosshair className="w-5 h-5" />,
          delay: 0.15,
        },
        {
          label: "Sniper Scope",
          value: scaleValue(result.sniperScope, selectedDpi),
          icon: <Eye className="w-5 h-5" />,
          delay: 0.2,
        },
        {
          label: "Free Look",
          value: scaleValue(result.freeLook, selectedDpi),
          icon: <Zap className="w-5 h-5" />,
          delay: 0.25,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background ff-grid-bg font-body">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/assets/generated/ff-hero-bg.dim_1600x600.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

        {/* Floating ember particles */}
        {EMBER_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full ember-glow"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `oklch(0.76 0.18 ${p.hue})`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              filter: "blur(1px)",
              opacity: 0.6,
            }}
          />
        ))}

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-primary font-display font-semibold tracking-widest text-sm uppercase">
              Free Fire Pro Tools
            </span>
            <Flame className="w-6 h-6 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight mb-4"
            style={{ textShadow: "0 0 40px oklch(0.76 0.18 60 / 0.5)" }}
          >
            <span className="text-foreground">Sensitivity</span>
            <br />
            <span
              className="text-primary"
              style={{ WebkitTextStroke: "1px oklch(0.68 0.22 45)" }}
            >
              Generator
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10"
          >
            Enter your device name and get optimized Free Fire sensitivity
            settings — instantly.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card/70 backdrop-blur-md border border-border shadow-fire">
              {/* Device input + generate button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    data-ocid="device.input"
                    className="pl-10 bg-transparent border-0 text-foreground placeholder:text-muted-foreground text-base h-12 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="e.g. Samsung Galaxy A32, iPhone 13, Redmi Note 10..."
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                  />
                </div>
                <Button
                  data-ocid="device.primary_button"
                  onClick={handleGenerate}
                  disabled={isPending || !deviceName.trim()}
                  className="h-12 px-8 bg-primary text-primary-foreground font-display font-bold text-base hover:opacity-90 transition-all pulse-glow-card rounded-lg gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* DPI Selector */}
              <div
                data-ocid="dpi.select"
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                <span className="text-muted-foreground text-xs font-display font-bold uppercase tracking-widest w-8 shrink-0">
                  DPI
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DPI_OPTIONS.map((dpi, idx) => (
                    <button
                      key={dpi}
                      type="button"
                      data-ocid={`dpi.toggle.${idx + 1}`}
                      onClick={() => setSelectedDpi(dpi)}
                      className={`px-3 py-1 rounded-md text-xs font-display font-bold transition-all border ${
                        selectedDpi === dpi
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_oklch(0.76_0.18_60/0.4)]"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {dpi}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Loading */}
        <AnimatePresence>
          {isPending && (
            <motion.div
              data-ocid="sensitivity.loading_state"
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <Flame className="absolute inset-0 m-auto w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground font-display font-semibold text-lg">
                Analyzing device profile...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {isError && !isPending && (
            <motion.div
              data-ocid="sensitivity.error_state"
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <p className="text-destructive font-display font-bold text-xl">
                Something went wrong
              </p>
              <p className="text-muted-foreground text-sm">
                {error?.message ?? "Could not generate sensitivity."}
              </p>
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !isPending && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Device name + tier badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
              >
                <div>
                  <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">
                    Sensitivity for
                  </p>
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground">
                    {deviceName}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-display uppercase tracking-widest">
                    DPI:{" "}
                    <span className="text-primary font-bold">
                      {selectedDpi}
                    </span>
                  </span>
                  <Badge
                    className={`px-4 py-2 text-sm font-display font-bold uppercase tracking-widest border ${tierClass} rounded-full`}
                  >
                    {result.deviceTier}
                  </Badge>
                </div>
              </motion.div>

              {/* Sensitivity grid */}
              <div
                data-ocid="sensitivity.list"
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {sensitivityCards.map((card, idx) => (
                  <motion.div
                    key={card.label}
                    data-ocid={`sensitivity.item.${idx + 1}`}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: card.delay }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    className="relative group overflow-hidden rounded-xl border border-border bg-card p-5 flex flex-col gap-3 cursor-default"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.16 0.008 260), oklch(0.13 0.005 260))",
                    }}
                  >
                    {/* Orange corner accent */}
                    <div
                      className="absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{
                        background:
                          "radial-gradient(circle at top right, oklch(0.76 0.18 60), transparent 70%)",
                      }}
                    />

                    <div className="flex items-center gap-2 text-primary">
                      {card.icon}
                      <span className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {card.label}
                      </span>
                    </div>

                    <div
                      className="font-display font-extrabold text-5xl md:text-6xl leading-none text-foreground"
                      style={{
                        textShadow: "0 0 20px oklch(0.76 0.18 60 / 0.35)",
                      }}
                    >
                      {card.value}
                    </div>

                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((card.value / 200) * 100, 100)}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: card.delay + 0.3,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Fire Button Size Card */}
              {fireButton && (
                <motion.div
                  data-ocid="fire_button.card"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="mt-6 relative overflow-hidden rounded-xl border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.16 0.008 260), oklch(0.13 0.005 260))",
                  }}
                >
                  {/* Decorative glow */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-10"
                    style={{
                      background:
                        "radial-gradient(circle at top right, oklch(0.76 0.18 60), transparent 70%)",
                    }}
                  />

                  <div
                    className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.76 0.18 60 / 0.2), oklch(0.68 0.22 45 / 0.1))",
                      border: "1px solid oklch(0.76 0.18 60 / 0.3)",
                    }}
                  >
                    <Hand className="w-7 h-7 text-primary" />
                  </div>

                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs font-display font-bold uppercase tracking-widest mb-1">
                      Recommended Fire Button Size
                    </p>
                    <p
                      className="font-display font-extrabold text-3xl text-foreground mb-1"
                      style={{
                        textShadow: "0 0 20px oklch(0.76 0.18 60 / 0.35)",
                      }}
                    >
                      {fireButton.size}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {fireButton.reason}
                    </p>
                  </div>

                  {/* Size indicator pills */}
                  <div className="flex gap-1.5 items-end shrink-0">
                    {(["Small", "Medium", "Large"] as const).map((size) => (
                      <div
                        key={size}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="rounded transition-all"
                          style={{
                            width:
                              size === "Small"
                                ? "16px"
                                : size === "Medium"
                                  ? "22px"
                                  : "28px",
                            height:
                              size === "Small"
                                ? "16px"
                                : size === "Medium"
                                  ? "22px"
                                  : "28px",
                            background:
                              fireButton.size === size
                                ? "oklch(0.76 0.18 60)"
                                : "oklch(0.24 0.01 260)",
                            boxShadow:
                              fireButton.size === size
                                ? "0 0 10px oklch(0.76 0.18 60 / 0.5)"
                                : "none",
                          }}
                        />
                        <span
                          className="text-[9px] font-display font-bold uppercase"
                          style={{
                            color:
                              fireButton.size === size
                                ? "oklch(0.76 0.18 60)"
                                : "oklch(0.4 0.01 260)",
                          }}
                        >
                          {size[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tips section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-6 p-5 rounded-xl border border-primary/20 bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-bold text-foreground mb-1">
                      Pro Tip
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      These settings are optimized for your device tier.
                      Fine-tune by ±5 based on your personal playstyle. Higher
                      values give faster aim — lower values give more precision.
                      Adjust DPI if the sensitivity feels off, and match your
                      fire button size recommendation for best results.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !isPending && !isError && (
          <motion.div
            data-ocid="sensitivity.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="py-20 text-center"
          >
            <div className="inline-flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.76 0.18 60 / 0.15), oklch(0.68 0.22 45 / 0.08))",
                  border: "1px solid oklch(0.76 0.18 60 / 0.25)",
                }}
              >
                <Crosshair className="w-10 h-10 text-primary" />
              </div>
              <p className="font-display font-bold text-xl text-foreground">
                Ready to optimize
              </p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Type your device name above and hit Generate to get your perfect
                Free Fire sensitivity settings.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-primary">❤️</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              className="text-primary hover:underline font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SensitivityApp />
    </QueryClientProvider>
  );
}
