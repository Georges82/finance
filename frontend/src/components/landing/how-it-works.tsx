const steps = [
  {
    name: "Onboard Your Team",
            description: "Easily add team members, talent, and clients to your finance platform.",
  },
  {
    name: "Track Performance",
    description: "Input performance data and generate reports from various platforms.",
  },
  {
    name: "Automate Finances",
    description:
      "Our system automatically calculates payouts and invoices based on your custom rules.",
  },
  {
    name: "Gain Key Insights",
    description:
              "Get a clear view of your finance's financial health and profitability.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            Get started in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A simple, intuitive workflow to get your finance running on
            autopilot.
          </p>
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div
            className="absolute left-1/2 top-4 -ml-[1px] h-[calc(100%-2rem)] w-0.5 bg-border"
            aria-hidden="true"
          />
          <div className="grid grid-cols-1 gap-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="flex items-center justify-center mb-4">
                  <span className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-headline">{step.name}</h3>
                <p className="mt-2 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
