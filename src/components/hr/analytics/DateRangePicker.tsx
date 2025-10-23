import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
}

export const DateRangePicker = ({ startDate, endDate, onDateChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateChange(start, end);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateChange(undefined, undefined);
    setIsOpen(false);
  };

  const displayText = startDate && endDate
    ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
    : "Select date range";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handlePreset(7)}
          >
            Last 7 days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handlePreset(30)}
          >
            Last 30 days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handlePreset(90)}
          >
            Last 90 days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive"
            onClick={handleClear}
          >
            Clear filter
          </Button>
        </div>
        <div className="p-3">
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => onDateChange(date, endDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </div>
            {startDate && (
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => onDateChange(startDate, date)}
                  disabled={(date) => startDate ? date < startDate : false}
                  className="pointer-events-auto"
                />
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};