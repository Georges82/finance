
'use client';
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();
  const handleClick = () => {
    router.push('/login');
  };
  return (
    <section className="container grid items-center gap-12 py-20 lg:grid-cols-2 md:py-32">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl lg:text-6xl">
          The All-In-One Platform for Modern Agencies
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground">
          Streamline your operations. Automate salaries. Track performance — all
          in one dashboard.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" onClick={handleClick}>Login</Button>
        </div>
      </div>
      <div className="relative">
        <Image
          src="https://placehold.co/1000x700.png"
          alt="Goat Finance Dashboard"
          width={1000}
          height={700}
          className="rounded-xl shadow-2xl"
          data-ai-hint="dashboard user interface"
        />
        <div className="absolute p-4 hidden bg-card border rounded-lg shadow-xl -bottom-8 -right-8 md:block">
          <p className="text-lg font-bold">+15% Revenue Growth</p>
          <p className="text-sm text-muted-foreground">in the first month</p>
        </div>
      </div>
    </section>
  );
}
