import { Droplets, HeartHandshake, ShieldCheck, Zap } from "lucide-react";

const FEATURES = [
  { icon: Zap, text: "Urgent requests reach matching donors and hospitals instantly" },
  { icon: HeartHandshake, text: "Hospitals can lean on nearby hospitals' surplus stock, not just donors" },
  { icon: ShieldCheck, text: "Automatic eligibility tracking, so no donor is asked too soon" },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-950 md:flex md:flex-col md:justify-between md:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-red-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-16 top-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Droplets size={20} className="text-white" />
          </span>
          <span className="text-xl font-bold text-white">BloodLink</span>
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Every match starts with someone showing up.
          </h1>
          <p className="mt-3 max-w-sm text-red-100">
            A faster way for hospitals, donors, and nearby hospitals to coordinate
            when blood is needed urgently — no more relying on phone chains.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-red-50">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon size={13} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-red-200/80">
          Built for hospitals and donors across Ghana.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto flex w-full max-w-sm items-center gap-2.5 md:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            <Droplets size={18} />
          </span>
          <span className="text-lg font-bold text-red-700 dark:text-red-400">BloodLink</span>
        </div>
        <div className="mx-auto mt-6 w-full max-w-sm md:mt-0">{children}</div>
      </div>
    </div>
  );
}
