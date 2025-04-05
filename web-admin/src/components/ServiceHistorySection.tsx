import { useState, useEffect } from "react";
import { format, formatISO, parseISO, addDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface ServiceHistorySectionProps {
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
  onLastServiceDateChange: (date: string | null) => void;
  onLastServiceMileageChange: (mileage: number | null) => void;
  currentMileage?: number;
}

export function ServiceHistorySection({
  lastServiceDate,
  lastServiceMileage,
  onLastServiceDateChange,
  onLastServiceMileageChange,
  currentMileage = 0,
}: ServiceHistorySectionProps) {
  const [averageDailyMileage, setAverageDailyMileage] = useState<number | null>(null);
  const [estimatedNextServiceDate, setEstimatedNextServiceDate] = useState<string | null>(null);
  const [estimatedNextServiceMileage, setEstimatedNextServiceMileage] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Calculate service predictions when service history changes
  useEffect(() => {
    calculateServicePredictions();
  }, [lastServiceDate, lastServiceMileage, currentMileage]);

  const calculateServicePredictions = () => {
    // Only calculate if we have both last service date and mileage
    if (!lastServiceDate || !lastServiceMileage) {
      setAverageDailyMileage(null);
      setEstimatedNextServiceDate(null);
      setEstimatedNextServiceMileage(null);
      return;
    }

    try {
      const lastDate = parseISO(lastServiceDate);
      const now = new Date();
      const daysSinceService = Math.max(1, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate average daily mileage
      const mileageDifference = Math.max(0, currentMileage - lastServiceMileage);
      const avgDailyMileage = Math.round(mileageDifference / daysSinceService);
      setAverageDailyMileage(avgDailyMileage);
      
      // Typical service intervals
      const mileageInterval = 5000; // 5,000 km/miles between services
      const timeInterval = 180; // 6 months (180 days) between services
      
      // Calculate next service based on mileage
      const daysToNextServiceByMileage = avgDailyMileage > 0 
        ? Math.round((mileageInterval - (currentMileage % mileageInterval)) / avgDailyMileage)
        : timeInterval;
      
      // Use the earlier of time-based or mileage-based service
      const daysToNextService = Math.min(daysToNextServiceByMileage, timeInterval);
      const nextServiceDate = addDays(now, daysToNextService);
      setEstimatedNextServiceDate(formatISO(nextServiceDate, { representation: 'date' }));
      
      // Calculate estimated mileage at next service
      const estimatedMileage = currentMileage + (avgDailyMileage * daysToNextService);
      setEstimatedNextServiceMileage(Math.round(estimatedMileage));
    } catch (error) {
      console.error("Error calculating service predictions:", error);
      setAverageDailyMileage(null);
      setEstimatedNextServiceDate(null);
      setEstimatedNextServiceMileage(null);
    }
  };

  const handleLastServiceMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const mileage = value ? parseInt(value) : null;
    onLastServiceMileageChange(mileage);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onLastServiceDateChange(formatISO(date, { representation: 'date' }));
    } else {
      onLastServiceDateChange(null);
    }
    setDatePickerOpen(false);
  };

  const TodayButton = () => {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const today = new Date();
          onLastServiceDateChange(formatISO(today, { representation: 'date' }));
          setDatePickerOpen(false);
        }}
      >
        Today
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Service History Section */}
      <div className="bg-blue-900 text-white p-3 font-medium">
        Service History
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-3">
        <div className="space-y-2">
          <label htmlFor="lastServiceDate" className="text-sm font-medium">
            Last Service Date:
          </label>
          <div className="flex items-center">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                >
                  {lastServiceDate ? format(parseISO(lastServiceDate), "dd/MM/yyyy") : "Select date"}
                  <Calendar className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single" 
                  selected={lastServiceDate ? parseISO(lastServiceDate) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                />
                <div className="flex justify-end p-2 border-t">
                  <TodayButton />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="lastServiceMileage" className="text-sm font-medium">
            Last Service Mileage:
          </label>
          <Input
            id="lastServiceMileage"
            type="number"
            value={lastServiceMileage || ""}
            onChange={handleLastServiceMileageChange}
            placeholder="Enter mileage"
          />
        </div>
      </div>

      {/* Service Predictions Section */}
      <div className="bg-blue-900 text-white p-3 font-medium">
        Service Predictions
      </div>
      
      <div className="p-3 text-sm">
        <p className="text-gray-500 mb-2">These fields are calculated automatically based on mileage updates and service history.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Average Daily Mileage (km):</p>
            <p className="text-lg">
              {averageDailyMileage !== null ? averageDailyMileage : "-"}
            </p>
          </div>
          
          <div>
            <p className="font-medium">Estimated Next Service Date:</p>
            <p className="text-lg">
              {estimatedNextServiceDate 
                ? format(parseISO(estimatedNextServiceDate), "dd/MM/yyyy") 
                : "-"}
            </p>
          </div>
          
          <div>
            <p className="font-medium">Estimated Next Service Mileage:</p>
            <p className="text-lg">
              {estimatedNextServiceMileage !== null ? estimatedNextServiceMileage : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 