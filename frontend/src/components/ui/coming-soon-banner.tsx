import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Construction } from 'lucide-react';

interface ComingSoonBannerProps {
  title?: string;
  description?: string;
}

export function ComingSoonBanner({ 
  title = "Coming Soon", 
  description = "This feature is currently under development and will be available shortly." 
}: ComingSoonBannerProps) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">{title}</h1>
        <p className="text-muted-foreground">
          {description}
        </p>
      </header>

      <Card className="flex items-center justify-center h-96">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Construction className="h-8 w-8" />
            <Clock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Feature Under Development</h2>
            <p className="text-muted-foreground max-w-md">
              We're working hard to bring you this feature. Check back soon for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 