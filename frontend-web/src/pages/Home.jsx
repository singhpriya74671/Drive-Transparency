import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const FEATURES = [
  {
    number: "01",
    title: "Enter vehicle details",
    description: "Choose a known model or type any make and model manually.",
  },
  {
    number: "02",
    title: "Add what you observe",
    description: "Enter readings, fault codes, or symptoms you already know.",
  },
  {
    number: "03",
    title: "Review clear guidance",
    description: "See which supplied inputs need attention and why.",
  },
];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#diagnostics") {
      navigate("/diagnostics", { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  return (
    <>
      <section id="home" className="overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Vehicle health, made clear
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Understand your car before the next repair.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Enter the vehicle information and observations you have. Drive Transparency organizes those inputs into an explainable rule-based screening report.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/diagnostics"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Explore diagnostics
              </Link>
              <a
                href="/input"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Enter vehicle details
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              No live OBD connection is assumed. The assessment uses only readings and symptoms that you provide.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-50/80 sm:-inset-7" />
            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">A clearer maintenance conversation</p>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">Your inputs. Explained.</h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg text-white" aria-hidden="true">
                  ✓
                </div>
              </div>
              <div className="mt-7 space-y-3">
                {[
                  ["Vehicle profile", "Identify the car you want to check"],
                  ["Observed information", "Add readings, codes, or symptoms"],
                  ["Screening report", "Review the rules and next steps"],
                ].map(([label, description], index) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-blue-700 ring-1 ring-slate-200">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                This is decision support, not a substitute for a physical inspection by a qualified technician.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Drive Transparency</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              A practical overview of the information that matters.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start with what you know about the vehicle. The diagnostic view keeps supplied values separate from unavailable sensor data.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold tracking-[0.12em] text-blue-700">{feature.number}</p>
                <h3 className="mt-3 text-base font-extrabold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Ready to review a vehicle?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Open the diagnostics section to choose a model, load the labeled sample, or enter your own details.</p>
            </div>
            <Link
              to="/diagnostics"
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Go to diagnostics
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
