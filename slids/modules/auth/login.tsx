"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/slids/store";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Checkbox } from "@/slids/components/ui/checkbox";
import { Eye, EyeOff, Sparkles, Globe2, Users2, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/vsourcess.png";
import { useRouter } from "next/navigation";
import Image from "next/image";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@vsourcecrm.com");
  const [password, setPassword] = useState("Admin@123");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

// useEffect(() => {
//   if (isAuthenticated) {
    
//     router.push("/dashboard");
//   }
// }, [isAuthenticated, router]);

// const onSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();

//   setLoading(true);

//   const res = await login(email, password);

//   setLoading(false);

//   if (res.ok) {
//     toast.success("Welcome back");
//     router.push("/dashboard");
//   } else {
//     toast.error(res.error ?? "Login failed");
//   }
// };

useEffect(() => {
  const checkAuth = async () => {
    const res = await fetch("/api/me");

    if (res.ok) {
      router.push("/assign-leads");
    }
  };

  checkAuth();
}, [router]);

const onSubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  try {
    setLoading(true);

    const res = await fetch(
      "/api/auth/signin",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return toast.error(
        data.message ||
          data.error ||
          "Login failed"
      );
    }

    toast.success(
      "Welcome back, " +
        data.user.name
    );

    router.push("/assign-leads");
    router.refresh();
  } catch (error) {
    console.error(error);

    toast.error(
      "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden md:flex flex-col justify-between p-10 overflow-hidden bg-[image:var(--gradient-primary)] text-white">
        <motion.div
          aria-hidden
          className="absolute -top-32 -right-32 size-[420px] rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -left-32 size-[420px] rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur px-3 py-2">
            <Image src={logo} alt="VSource Logo" className="h-10 w-auto object-contain md:h-12" width={120} height={48} />
          </div>

          <div className="leading-tight">
            <h2 className="text-lg font-bold text-white">VSource</h2>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
              Study Abroad CRM
            </p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            One platform for your entire <br /> overseas admissions fintech company journey.
          </h2>
          <p className="text-white/85 max-w-md">
            Manage leads, applications, loans and counselor performance — all in a
            single, beautifully designed workspace.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Users2, label: "Lead Pipeline" },
              { icon: GraduationCap, label: "Admissions" },
              { icon: Globe2, label: "8+ Countries" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="rounded-xl p-3 bg-white/10 backdrop-blur border border-white/15"
              >
                <f.icon className="size-4 mb-2" />
                <div className="text-xs font-medium">{f.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          {" "}
          <p className="mt-10 text-center text-sm text-white/70">
            © {new Date().getFullYear()}Powered by{" "}
            <a
              href="https://www.outrightcreators.com/"
              className="font-medium text-white hover:underline"
            >
              Outright Creators
            </a>
            {". "} · v.demo-1.0
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden mb-6 flex items-center gap-2">
            <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="font-bold">VSource CRM</div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Sign in to your workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => toast.info("Reset link sent to your email")}
                >
                  Forgot password?
                </button>
              </div> */}
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-xs space-y-2">
            <div className="font-semibold">Demo credentials</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@vsourcecrm.com");
                  setPassword("Admin@123");
                }}
                className="rounded-lg border border-border bg-background p-2 text-left hover:border-primary transition-colors"
              >
                <div className="font-semibold text-foreground">Admin</div>
                <div className="text-muted-foreground">admin@vsourcecrm.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("counselor@vsourcecrm.com");
                  setPassword("Counselor@123");
                }}
                className="rounded-lg border border-border bg-background p-2 text-left hover:border-primary transition-colors"
              >
                <div className="font-semibold text-foreground">Counselor</div>
                <div className="text-muted-foreground">counselor@vsourcecrm.com</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage