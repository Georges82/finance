import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export function Testimonial() {
  return (
    <section id="testimonials" className="py-20 md:py-32">
      <div className="container">
        <Card className="mx-auto max-w-4xl border-2 border-primary/50 bg-background shadow-xl">
          <CardContent className="p-8 md:p-12">
            <blockquote className="text-center">
              <p className="text-xl font-medium font-headline text-foreground md:text-2xl">
                "Goat Finance reduced 90% of our manual work. What used to take
                days now takes minutes. It&apos;s an absolute game-changer for any
                serious finance."
              </p>
              <footer className="mt-6">
                <div className="flex items-center justify-center gap-4">
                  <Image
                    src="https://placehold.co/48x48.png"
                    alt="Finance Manager"
                    width={48}
                    height={48}
                    className="rounded-full"
                    data-ai-hint="person avatar"
                  />
                  <div>
                    <p className="font-bold">Jane Doe</p>
                    <p className="text-sm text-muted-foreground">
                      Finance Manager
                    </p>
                  </div>
                </div>
              </footer>
            </blockquote>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
