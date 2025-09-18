
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, DollarSign, FileText, Users } from "lucide-react";

const features = [
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    title: "Automated Payouts",
    description:
      "Automate complex payout and salary calculations based on performance, saving hours of manual work.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Team & Client Management",
    description:
      "A centralized database for all your talent, staff, and clients, with profiles and performance tracking.",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: "Performance Insights",
    description:
              "Visualize key metrics and get actionable insights to boost finance growth and profitability.",
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "Real-time Financial Reporting",
    description:
      "Track revenue, expenses, and profitability with up-to-the-minute reports for any period.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-accent/50 py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            Everything you need to run your finance
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Goat Finance is built with powerful features to help you manage and
            grow your business efficiently.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-background shadow-md transition-shadow duration-300 hover:shadow-xl"
            >
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
                <CardDescription className="pt-2">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
