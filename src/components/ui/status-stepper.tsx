"use client";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Step<T extends string> = {
  key: T;
  label: string;
};

type StatusStepperProps<T extends string> = {
  current: T;
  steps: Array<Step<T>>;
  rank: Record<T, number>;
};

export function StatusStepper<T extends string>({
  current,
  steps,
  rank,
}: StatusStepperProps<T>) {
  const lastIndex = steps.length - 1;
  const currentIndex = steps.findIndex((step) => step.key === current);
  const safeIndex = currentIndex === -1 ? lastIndex : currentIndex;
  const progress = lastIndex > 0 ? (safeIndex / lastIndex) * 100 : 0;

  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-5 flex">
        <div className="mx-5 h-px flex-1 rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="relative flex items-start justify-between">
        {steps.map((step, index) => {
          const isCurrent = current === step.key;
          const isFinalStep = index === lastIndex;
          const isDone =
            rank[current] > rank[step.key] || (isCurrent && isFinalStep);
          const isActive = isCurrent && !isDone;
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 text-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  isDone &&
                    "border-emerald-500 bg-emerald-500 text-white shadow-[--shadow-pill]",
                  isActive &&
                    "border-emerald-700 bg-emerald-100 text-emerald-800",
                  !isDone &&
                    !isActive &&
                    "border-emerald-200 bg-white text-emerald-400",
                )}
              >
                {isDone ? <CheckIcon size={18} /> : index + 1}
              </div>
              <div
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-emerald-700" : "text-[--text-mid]",
                )}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
