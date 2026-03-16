import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Flame,
  Loader2,
  LogOut,
  Receipt,
  RefreshCw,
  Shield,
  Unlock,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";

const ADMIN_USER = "Zeeshan55";
const ADMIN_PASS = "firex55";

interface PaidUserInfo {
  paidUntil: bigint;
  name: string;
  user: Principal;
  isPaid: boolean;
  deviceName: string;
}

interface Transaction {
  principal: Principal;
  txId: string;
  timestamp: bigint;
}

function formatExpiry(nanoseconds: bigint): string {
  if (nanoseconds === 0n) return "—";
  const ms = Number(nanoseconds / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(nanoseconds: bigint): string {
  if (!nanoseconds) return "—";
  const ms = Number(nanoseconds / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery<PaidUserInfo[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaidUsers() as Promise<PaidUserInfo[]>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const {
    data: pendingTxs = [],
    isLoading: txLoading,
    refetch: refetchTxs,
  } = useQuery<Transaction[]>({
    queryKey: ["pendingTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingTransactions() as Promise<Transaction[]>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });

  const unlockMutation = useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("No actor");
      await actor.markUserAsPaid(user);
    },
    onSuccess: () => {
      toast.success("User unlocked for 30 days!");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => {
      toast.error("Failed to unlock user.");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.approveTransaction(txId);
    },
    onSuccess: () => {
      toast.success("User unlocked for 30 days!");
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => {
      toast.error("Failed to approve transaction.");
    },
  });

  const paidCount = users.filter((u) => u.isPaid).length;
  const totalCount = users.length;
  const pendingCount = pendingTxs.length;

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Shield size={22} className="text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide">
              FF<span className="text-primary">Sensi</span>
              <span className="ml-2 text-xs text-primary border border-primary/30 rounded px-1.5 py-0.5">
                ADMIN
              </span>
            </span>
          </div>
          <Button
            data-ocid="admin.secondary_button"
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground text-xs gap-1"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-display">
                  Total Users
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {totalCount}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="rounded-xl border border-primary/30 bg-card p-4 flex items-center gap-3 glow-orange"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Unlock size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-display">
                  Paid Users
                </p>
                <p className="text-2xl font-display font-bold text-primary">
                  {paidCount}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-muted">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-display">
                  Free Users
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {totalCount - paidCount}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.21 }}
              className={`rounded-xl border bg-card p-4 flex items-center justify-between ${
                pendingCount > 0 ? "border-yellow-400/40" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    pendingCount > 0 ? "bg-yellow-400/10" : "bg-muted"
                  }`}
                >
                  <Clock
                    size={18}
                    className={
                      pendingCount > 0
                        ? "text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-display">
                    Pending
                  </p>
                  <p
                    className={`text-2xl font-display font-bold ${
                      pendingCount > 0 ? "text-yellow-400" : "text-foreground"
                    }`}
                  >
                    {pendingCount}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  refetchTxs();
                  refetchUsers();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={14} />
              </Button>
            </motion.div>
          </div>

          {/* Pending Transactions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-xl border border-yellow-400/25 bg-card overflow-hidden mb-6"
          >
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-yellow-400" />
                <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground">
                  Pending Transactions
                </h2>
                {pendingCount > 0 && (
                  <span className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 text-xs font-display font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </div>
              {txLoading && (
                <Loader2 size={14} className="text-primary animate-spin" />
              )}
            </div>

            {txLoading ? (
              <div className="p-8 text-center" data-ocid="admin.loading_state">
                <Loader2
                  size={24}
                  className="text-primary animate-spin mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm font-display">
                  Loading transactions...
                </p>
              </div>
            ) : pendingTxs.length === 0 ? (
              <div className="p-8 text-center" data-ocid="admin.empty_state">
                <Clock
                  size={28}
                  className="text-muted-foreground/40 mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm font-display">
                  No pending transactions
                </p>
              </div>
            ) : (
              <Table data-ocid="admin.table">
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Transaction ID
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {pendingTxs.map((tx, i) => (
                      <motion.tr
                        key={tx.txId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        data-ocid={`admin.row.${i + 1}`}
                        className="border-border/60 hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-yellow-400 bg-yellow-400/5 border border-yellow-400/20 rounded px-2 py-0.5">
                            {tx.txId.length > 24
                              ? `${tx.txId.slice(0, 24)}…`
                              : tx.txId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-xs">
                            {formatTimestamp(tx.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-ocid={`admin.confirm_button.${i + 1}`}
                            size="sm"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(tx.txId)}
                            className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400 hover:text-black font-display font-bold uppercase tracking-widest text-xs h-7 px-3 transition-all"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <Unlock size={12} className="mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground">
                Registered Users
              </h2>
              {usersLoading && (
                <Loader2 size={14} className="text-primary animate-spin" />
              )}
            </div>

            {usersLoading ? (
              <div className="p-10 text-center" data-ocid="admin.loading_state">
                <Loader2
                  size={28}
                  className="text-primary animate-spin mx-auto mb-3"
                />
                <p className="text-muted-foreground text-sm font-display">
                  Loading users...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center" data-ocid="admin.empty_state">
                <Users
                  size={32}
                  className="text-muted-foreground/40 mx-auto mb-3"
                />
                <p className="text-muted-foreground text-sm font-display">
                  No users registered yet
                </p>
              </div>
            ) : (
              <Table data-ocid="admin.table">
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Device
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                      Expires
                    </TableHead>
                    <TableHead className="font-display uppercase tracking-widest text-xs text-muted-foreground text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {users.map((u, i) => (
                      <motion.tr
                        key={u.user.toString()}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        data-ocid={`admin.row.${i + 1}`}
                        className="border-border/60 hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-display font-semibold text-foreground text-sm">
                            {u.name || (
                              <span className="text-muted-foreground italic">
                                —
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {u.deviceName || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {u.isPaid ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-display">
                              PAID
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground border-border/60 text-xs font-display"
                            >
                              FREE
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-xs">
                            {u.isPaid ? formatExpiry(u.paidUntil) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-ocid={`admin.button.${i + 1}`}
                            size="sm"
                            disabled={unlockMutation.isPending}
                            onClick={() => unlockMutation.mutate(u.user)}
                            className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-display font-bold uppercase tracking-widest text-xs h-7 px-3 transition-all"
                          >
                            {unlockMutation.isPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <Unlock size={12} className="mr-1" />
                                Unlock 30d
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-4 py-4">
        <div className="max-w-5xl mx-auto text-center text-xs text-muted-foreground">
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

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    onExit();
  };

  if (loggedIn) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center px-4">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] bg-primary/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-5 glow-orange">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-1">
            <span className="text-foreground">ADMIN</span>
            <span className="text-primary"> PANEL</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            FF Sensi — Restricted Access
          </p>
        </div>

        <Card className="border-border/60 bg-card/90 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-center text-muted-foreground uppercase tracking-widest text-xs">
              Administrator Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                data-ocid="admin.input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
              />
              <Input
                data-ocid="admin.input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-ocid="admin.error_state"
                  className="text-xs text-red-400 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              data-ocid="admin.submit_button"
              onClick={handleLogin}
              disabled={!username || !password}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold uppercase tracking-widest glow-orange h-11 text-sm transition-all"
            >
              <Flame size={14} className="mr-2" />
              Login as Admin
            </Button>

            <button
              type="button"
              onClick={onExit}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
            >
              ← Back to App
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
