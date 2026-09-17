import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Mark";

const benefits = [
  {
    name: "Focus",
    line: "The rest of the machine goes quiet so the call can be the only thing.",
  },
  {
    name: "Dated note",
    line: "One file per meeting, already on disk before you join.",
  },
  {
    name: "Calendar Join",
    line: "The next event sits in the menu extra. One click into the room.",
  },
  {
    name: "Consent-first listening",
    line: "Nothing records until you start it. Listening never starts on its own.",
  },
  {
    name: "Live cues",
    line: "A quiet nudge while you are in it — not a transcript dump after.",
  },
  {
    name: "Wrap-up",
    line: "You hang up with a page, not a blank.",
  },
  {
    name: "Local",
    line: "Notes stay on the machine. No account required to start the ritual.",
  },
  {
    name: "The shortcut",
    line: "Control-Option-M. Same motion, every call.",
  },
];

const steps = [
  {
    n: "01",
    title: "Flip it on",
    body: "Click the menu extra, or press the shortcut, when the meeting is about to start.",
  },
  {
    n: "02",
    title: "Join from the extra",
    body: "The next calendar event is already there. Join, then open the dated note if you want a page in front of you.",
  },
  {
    n: "03",
    title: "Listen only if you mean it",
    body: "Start listening after the consent sheet. Live cues stay out of the way. Wrap-up is waiting when you hang up.",
  },
];

export function Landing() {
  useEffect(() => {
    const app = document.getElementById("app");
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      appHeight: app?.style.height ?? "",
      htmlBg: html.style.background,
      bodyBg: body.style.background,
    };
    if (app) app.style.height = "auto";
    html.style.background = "#ffffff";
    body.style.background = "#ffffff";
    return () => {
      if (app) app.style.height = prev.appHeight;
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
    };
  }, []);

  return (
    <div className="mm-market min-h-dvh bg-white text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-black/6 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="text-[#111]">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-8 text-[15px] text-black/55 sm:flex">
            <a href="#product" className="hover:text-black">
              Product
            </a>
            <a href="#benefits" className="hover:text-black">
              Benefits
            </a>
            <a href="#pricing" className="hover:text-black">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/preview"
              className="hidden rounded-full px-3.5 py-1.5 text-[14px] text-black/70 hover:bg-black/4 sm:inline-flex"
            >
              Preview
            </Link>
            <Link
              to="/app"
              className="inline-flex rounded-full bg-[#111111] px-3.5 py-1.5 text-[14px] font-medium text-white hover:bg-black"
            >
              Download for Mac
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-3xl px-5 pb-6 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="mb-6 inline-flex rounded-full border border-black/8 bg-white px-3 py-1 text-[13px] text-black/55">
            A menu-bar ritual for calls
          </p>
          <h1 className="text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[4.15rem]">
            Meetings, with a ritual.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-black/55 sm:text-[19px]">
            Focus. A dated note. Join from the calendar. Optional listening —
            only after you say so. The call stays the point.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-black"
            >
              Download for Mac
            </Link>
            <a
              href="#pricing"
              className="inline-flex rounded-full border border-black/12 bg-white px-5 py-2.5 text-[15px] text-[#111] hover:bg-black/[0.03]"
            >
              See monthly plans
            </a>
          </div>
        </section>

        <section id="product" className="px-4 pb-8 pt-6 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-[22px] border border-black/8 bg-[#f4f4f5] shadow-[0_30px_80px_-28px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 border-b border-black/6 px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <p className="ml-2 text-[12px] text-black/40">
                  meetingmode.xyz/preview — live, not a mock
                </p>
              </div>
              <div className="relative aspect-[16/10] bg-ink">
                <iframe
                  title="Meeting Mode desktop"
                  src="/preview?embed=1"
                  className="absolute inset-0 size-full border-0"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-[13px] text-black/40">
              Click the menu extra in the bar, or press Control-Option-M.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-black/40">
            Why it exists
          </p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#111] sm:text-[2.6rem]">
            Calls go better when the computer has a job.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-black/55">
            Most tools try to replace the meeting. Meeting Mode sits in the
            menu bar and runs a short ritual around it — so you arrive, stay
            present, and leave with a page.
          </p>
        </section>

        <section id="benefits" className="border-y border-black/6">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            {benefits.map((item) => (
              <div
                key={item.name}
                className="grid gap-2 border-b border-black/6 py-7 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-10 sm:py-8"
              >
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#111]">
                  {item.name}
                </h3>
                <p className="text-[16px] leading-relaxed text-black/55">
                  {item.line}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <p className="text-center text-[13px] font-medium uppercase tracking-[0.16em] text-black/40">
            The ritual
          </p>
          <h2 className="mt-3 text-center text-[2rem] font-semibold tracking-[-0.04em] text-[#111] sm:text-[2.4rem]">
            Three moves. Then you are in the call.
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n}>
                <p className="font-mono text-[12px] tracking-wide text-black/35">
                  {step.n}
                </p>
                <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.03em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-black/55">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="border-t border-black/6 bg-[#fafafa]">
          <div className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
            <p className="text-center text-[13px] font-medium uppercase tracking-[0.16em] text-black/40">
              Monthly
            </p>
            <h2 className="mt-3 text-center text-[2rem] font-semibold tracking-[-0.04em] sm:text-[2.4rem]">
              Start the ritual. Pay when the listening matters.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-black/8 bg-white p-7">
                <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-black/40">
                  Trial
                </p>
                <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">
                  Free
                </p>
                <p className="mt-1 text-[15px] text-black/50">
                  Feel the motion before you subscribe.
                </p>
                <ul className="mt-6 space-y-2.5 text-[15px] text-black/70">
                  <li>Focus on / off</li>
                  <li>Dated notes on disk</li>
                  <li>Calendar Join</li>
                  <li>Menu extra + shortcut</li>
                </ul>
                <Link
                  to="/app"
                  className="mt-8 inline-flex rounded-full border border-black/12 px-4 py-2 text-[14px] font-medium hover:bg-black/[0.03]"
                >
                  Download trial
                </Link>
              </article>
              <article className="rounded-2xl border border-black/80 bg-[#111] p-7 text-white">
                <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">
                  Pro
                </p>
                <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">
                  Monthly
                </p>
                <p className="mt-1 text-[15px] text-white/55">
                  For people who live in back-to-back calls.
                </p>
                <ul className="mt-6 space-y-2.5 text-[15px] text-white/80">
                  <li>Everything in Trial</li>
                  <li>Consent-first listening</li>
                  <li>Live cues in the meeting</li>
                  <li>Wrap-up when you hang up</li>
                </ul>
                <Link
                  to="/app"
                  className="mt-8 inline-flex rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#111] hover:bg-white/90"
                >
                  Download Pro
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-[13px] text-black/40 sm:flex-row sm:items-center sm:px-8">
          <Wordmark className="text-[13px] text-black/70" />
          <p>A local ritual for calls. Notes stay on the machine.</p>
          <Link to="/app" className="hover:text-black">
            Download for Mac →
          </Link>
        </div>
      </footer>
    </div>
  );
}
