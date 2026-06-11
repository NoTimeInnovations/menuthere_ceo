import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DueBanner } from "@/components/DueBanner";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex min-h-16 border-b bg-background/80 backdrop-blur">
        <nav className="flex w-full flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              M
            </div>
            <h1 className="text-base font-semibold">Menuthere CRM</h1>
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <DueBanner />
      <main className="flex w-full grow flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
