// components/DataCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DataCardProps {
  title: string;           // The profile type name (e.g., "Basic Details")
  description: string;     // A brief description of the profile type
  onSelect: () => void;    // Function to call when this type is selected
  isSelected: boolean;     // Whether this card is currently selected
}

export const DataCard: React.FC<DataCardProps> = ({ title, description, onSelect, isSelected }) => {
  return (
    <Card
      className={`glass transition-all duration-200 ${
        isSelected ? "border-2 border-primary shadow-lg" : "hover:shadow-md"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          variant={isSelected ? "default" : "outline"}
          className="w-full"
          onClick={onSelect}
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardContent>
    </Card>
  );
};