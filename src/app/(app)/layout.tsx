import { AppNav } from "@/components/AppNav";
import { ToastProvider } from "@/components/ui/Toast";

// Auth gating is handled in src/middleware.ts (redirects to /login).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <AppNav />
        {children}
      </div>
    </ToastProvider>
  );
}
