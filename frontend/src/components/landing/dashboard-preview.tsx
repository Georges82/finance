import Image from "next/image";

export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="bg-accent/50 py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            Your Finance&apos;s Command Center
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A beautiful and intuitive dashboard to see everything at a glance.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-2xl lg:p-8">
          <div className="flex items-center gap-2 rounded-t-lg bg-background p-2">
            <span className="h-3 w-3 rounded-full bg-red-400"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
            <span className="h-3 w-3 rounded-full bg-green-400"></span>
          </div>
          <Image
            src="https://placehold.co/1200x800.png"
            alt="Goat Finance Dashboard Preview"
            width={1200}
            height={800}
            className="rounded-b-lg border-b border-x"
            data-ai-hint="dashboard analytics"
          />
        </div>
      </div>
    </section>
  );
}
