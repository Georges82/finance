'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Period {
  id: string;
  name: string;
}

interface PeriodSelectorProps {
  availablePeriods: Period[];
  selectedPeriods: Period[];
  onPeriodToggle: (period: Period) => void;
}

export function PeriodSelector({
  availablePeriods,
  selectedPeriods,
  onPeriodToggle
}: PeriodSelectorProps) {
  const isSelected = (period: Period) => {
    return selectedPeriods.some(p => p.id === period.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Period Selection</span>
          <div className="text-sm text-muted-foreground">
            {selectedPeriods.length} of {availablePeriods.length} selected
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {availablePeriods.map((period) => (
            <Button
              key={period.id}
              variant={isSelected(period) ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodToggle(period)}
              className="transition-all duration-200"
            >
              {period.name}
            </Button>
          ))}
        </div>
        {selectedPeriods.length === 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Select at least one period to view salary data
          </div>
        )}
      </CardContent>
    </Card>
  );
}













