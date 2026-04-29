import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex min-h-16 border-b bg-background/80 backdrop-blur">
        <nav className="container w-full flex flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              M
            </div>
            <h1 className="text-base font-semibold">Menuthere CRM</h1>
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="container flex grow flex-col py-8">{children}</main>
    </div>
  );
}
