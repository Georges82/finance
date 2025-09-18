
'use client';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useRouter } from 'next/navigation';

export function CtaFooter() {
  const router = useRouter();
  const handleClick = () => {
    router.push('/login');
  };
  return (
    <footer className="bg-accent/50">
      <div className="container py-16 text-center md:py-24">
        <h2 className="text-3xl font-bold font-headline md:text-4xl lg:text-5xl">
          Ready to streamline your finance?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Stop juggling spreadsheets and start focusing on what matters: growth.
        </p>
        <div className="mt-8">
          <Button size="lg" onClick={handleClick}>Login</Button>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Goat Finance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
