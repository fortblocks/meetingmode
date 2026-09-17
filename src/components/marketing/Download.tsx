import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Mark";

const SOURCE_ZIP =
  "https://github.com/fortblocks/meetingmode/archive/refs/heads/main.zip";
const XCODE_PATH =
  "https://github.com/fortblocks/meetingmode/tree/main/macos/MeetingMode";

const versions = [
  {
    version: "0.1.0",
    date: "17 Sep 2026",
    channel: "Source · Xcode",
    href: SOURCE_ZIP,
    notes:
      "First native build. Menu extra, Focus, dated notes, Calendar Join, Control-Option-M, consent sheet. Listening and wrap-up are stubbed until a signed 0.2.",
  },
];

export function Download() {
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
          <Link to="/" className="text-[#111]">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] text-black/55 sm:flex">
            <Link to="/" className="hover:text-black">
              Product
            </Link>
            <Link to="/preview" className="hover:text-black">
              Browser preview
            </Link>
          </nav>
          <a
            href={SOURCE_ZIP}
            className="inline-flex rounded-full bg-[#111111] px-3.5 py-1.5 text-[14px] font-medium text-white hover:bg-black"
          >
            Download 0.1.0
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <p className="mb-6 inline-flex rounded-full border border-black/8 bg-white px-3 py-1 text-[13px] text-black/55">
          Mac · 0.1.0
        </p>
        <h1 className="text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[3.4rem]">
          Download Meeting Mode.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-black/55 sm:text-[18px]">
          This build is the Xcode project so you can run it as a real menu-bar
          app on your Mac, refine the ritual, then publish signed versions here
          when they are ready. There is no packaged .app yet — 0.1.0 is source
          you compile locally in a minute.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={SOURCE_ZIP}
            className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-black"
          >
            Download source zip
          </a>
          <a
            href={XCODE_PATH}
            className="inline-flex rounded-full border border-black/12 bg-white px-5 py-2.5 text-[15px] text-[#111] hover:bg-black/[0.03]"
          >
            Open in GitHub
          </a>
          <Link
            to="/preview"
            className="inline-flex rounded-full px-4 py-2.5 text-[15px] text-black/60 hover:text-black"
          >
            Browser preview →
          </Link>
        </div>

        <ol className="mt-16 space-y-8 border-t border-black/6 pt-12">
          <li className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-10">
            <p className="font-mono text-[12px] tracking-wide text-black/35">01</p>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em]">
                Unzip and open the project
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/55">
                After the zip lands, open{" "}
                <code className="rounded bg-black/4 px-1.5 py-0.5 font-mono text-[13px]">
                  macos/MeetingMode/MeetingMode.xcodeproj
                </code>{" "}
                in Xcode 15 or newer. macOS 14+ is required.
              </p>
            </div>
          </li>
          <li className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-10">
            <p className="font-mono text-[12px] tracking-wide text-black/35">02</p>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em]">
                Select your team and run
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/55">
                Signing & Capabilities → Team (Personal Team is fine). Then
                Product → Run (⌘R). The app is a menu extra — look in the menu
                bar for the focus-ring, not the Dock.
              </p>
            </div>
          </li>
          <li className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-10">
            <p className="font-mono text-[12px] tracking-wide text-black/35">03</p>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em]">
                Use it as a real user
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/55">
                Control-Option-M flips Focus. The extra shows the next calendar
                event and Join when a Meet, Zoom, Teams, or Webex link is on it.
                Dated notes write to{" "}
                <code className="rounded bg-black/4 px-1.5 py-0.5 font-mono text-[13px]">
                  ~/Meeting Mode
                </code>
                . Listening is a consent sheet only in 0.1.0.
              </p>
            </div>
          </li>
          <li className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-10">
            <p className="font-mono text-[12px] tracking-wide text-black/35">04</p>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em]">
                Publish the next version here
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/55">
                When a signed build is ready: Product → Archive, zip{" "}
                <code className="rounded bg-black/4 px-1.5 py-0.5 font-mono text-[13px]">
                  Meeting Mode.app
                </code>{" "}
                as{" "}
                <code className="rounded bg-black/4 px-1.5 py-0.5 font-mono text-[13px]">
                  MeetingMode-0.2.0.zip
                </code>
                , drop it in{" "}
                <code className="rounded bg-black/4 px-1.5 py-0.5 font-mono text-[13px]">
                  public/releases/
                </code>
                , and add a row to this page. Testers then download a real app
                instead of source.
              </p>
            </div>
          </li>
        </ol>

        <section className="mt-16 border-t border-black/6 pt-12">
          <h2 className="text-[18px] font-semibold tracking-[-0.03em]">Versions</h2>
          <ul className="mt-6 divide-y divide-black/6 border-y border-black/6">
            {versions.map((release) => (
              <li
                key={release.version}
                className="grid gap-3 py-5 sm:grid-cols-[7rem_1fr_auto] sm:items-start"
              >
                <p className="font-mono text-[13px] text-black/50">{release.version}</p>
                <div>
                  <p className="text-[14px] font-medium">{release.channel}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-black/55">
                    {release.notes}
                  </p>
                  <p className="mt-2 text-[12px] text-black/35">{release.date}</p>
                </div>
                <a
                  href={release.href}
                  className="inline-flex h-fit rounded-full border border-black/12 px-3.5 py-1.5 text-[13px] font-medium hover:bg-black/[0.03]"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
