'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import * as ProgressPrimitive from '@radix-ui/react-progress';

function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-secondary relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      {(() => {
        const raw = value ?? 0;
        const safe = Number.isFinite(raw) ? Math.max(0, Math.min(raw, 100)) : 0;
        return (
          <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className={cn(
              'bg-primary h-full w-full flex-1 transition-all',
              indicatorClassName,
            )}
            style={{ transform: `translateX(-${100 - safe}%)` }}
          />
        );
      })()}
    </ProgressPrimitive.Root>
  );
}

function ProgressCircle({
  className,
  indicatorClassName,
  trackClassName,
  value = 0,
  size = 48,
  strokeWidth = 4,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  value?: number;
  size?: number;
  strokeWidth?: number;
  indicatorClassName?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      data-slot="progress-circle"
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={cn('text-secondary', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'text-primary transition-all duration-500 ease-in-out',
            indicatorClassName,
          )}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

function ProgressRadial({
  className,
  value = 0,
  size = 120,
  strokeWidth = 8,
  startAngle = -90,
  endAngle = 90,
  showLabel = false,
  trackClassName,
  indicatorClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  value?: number;
  size?: number;
  strokeWidth?: number;
  startAngle?: number;
  indicatorClassName?: string;
  trackClassName?: string;
  endAngle?: number;
  showLabel?: boolean;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const angleRange = endAngle - startAngle;
  const progressAngle = (value / 100) * angleRange;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const startX = size / 2 + radius * Math.cos(toRadians(startAngle));
  const startY = size / 2 + radius * Math.sin(toRadians(startAngle));
  const endX = size / 2 + radius * Math.cos(toRadians(startAngle + progressAngle));
  const endY = size / 2 + radius * Math.sin(toRadians(startAngle + progressAngle));

  const largeArc = progressAngle > 180 ? 1 : 0;

  const pathData = ['M', startX, startY, 'A', radius, radius, 0, largeArc, 1, endX, endY].join(' ');

  const trackEndX = size / 2 + radius * Math.cos(toRadians(endAngle));
  const trackEndY = size / 2 + radius * Math.sin(toRadians(endAngle));
  const trackLargeArc = angleRange > 180 ? 1 : 0;
  const trackPathData = [
    'M', startX, startY,
    'A', radius, radius, 0, trackLargeArc, 1, trackEndX, trackEndY,
  ].join(' ');

  return (
    <div
      data-slot="progress-radial"
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size}>
        <path
          d={trackPathData}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn('text-secondary', trackClassName)}
        />
        <path
          d={pathData}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn(
            'text-primary transition-all duration-500 ease-in-out',
            indicatorClassName,
          )}
        />
      </svg>
      {(showLabel || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || <span className="text-sm font-medium">{value}%</span>}
        </div>
      )}
    </div>
  );
}

export { Progress, ProgressCircle, ProgressRadial };
