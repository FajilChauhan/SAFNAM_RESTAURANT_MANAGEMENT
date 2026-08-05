import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

const homeByRole = {
  CUSTOMER: "/customer",
  RECEPTION: "/reception",
  KITCHEN: "/kitchen",
  MANAGER: "/manager",
  ADMIN: "/admin",
} as const;

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 dark:bg-dark">
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-primary-500/10" animate={{ y: [0, -18, 0] }} transition={{ repeat: Infinity, duration: 8 }} />
        <motion.div className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-secondary-500/10" animate={{ y: [0, 22, 0] }} transition={{ repeat: Infinity, duration: 10 }} />
        <motion.div className="absolute bottom-1/4 left-1/3 h-32 w-32 rounded-full bg-accent/10" animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 9 }} />
      </div>
      <div className="relative z-10 max-w-lg text-center">
        <Lock className="mx-auto mb-4 h-16 w-16 text-primary-600" />
        <div className="gradient-text font-display text-8xl font-bold">403</div>
        <h1 className="mt-4 font-display text-4xl text-slate-900 dark:text-slate-100">Access Restricted</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">You don't have permission to access this page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="gold" onClick={() => navigate(user ? homeByRole[user.role] : "/login")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
