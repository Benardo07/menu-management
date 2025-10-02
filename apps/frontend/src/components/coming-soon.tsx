import { Clock } from "lucide-react";

type ComingSoonProps = {
  title?: string;
  description?: string;
};

export function ComingSoon({
  title = "Coming soon",
  description = "We are working on this section. Please check back soon.",
}: ComingSoonProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-slate-600">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
        <Clock className="h-8 w-8 text-slate-400" aria-hidden />
      </div>
      <div>
        <p className="text-xl font-semibold text-slate-800">{title}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}
