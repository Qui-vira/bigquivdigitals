"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { getIcon } from "@/lib/icons";
import {
  BrutalButton,
  HandNote,
  Highlighter,
  PaperSection,
  PhotoPrint,
  SectionHead,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

interface ContactOption {
  icon: string;
  title: string;
  description: string;
  href: string;
}

interface ContactClientProps {
  contactOptions: ContactOption[];
  socialLinks: { name: string; href: string }[];
  serviceOptions: string[];
  formsubmitEmail: string;
}

/**
 * /contact on the paper system (redesign 2026-10, phase 2).
 *
 * The statement and the three routes sit together at the top, the way a
 * printed portfolio closes: one big line, then how to reach the person.
 * The form keeps its exact behaviour (FormSubmit POST, the same hidden
 * fields, the same names, HTML validation, the same submitted state); only
 * its look changed. Copy is unchanged.
 */

const FIELD =
  "block w-full border-[3px] border-ink bg-paper px-4 text-[16px] text-ink placeholder:text-ink-muted transition-[background-color,box-shadow] duration-150 focus:bg-gold-tint focus:shadow-brutal-sm focus:outline-none";

const LABEL = "mb-2 block font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink";

const ROW_TONE = ["bg-gold", "bg-gold-tint", "bg-paper"];

export function ContactClient({ contactOptions, socialLinks, serviceOptions, formsubmitEmail }: ContactClientProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. THE STATEMENT ───────── */}
      <PaperSection ground="grid" pad="none" innerClassName="pb-24 pt-28 md:pb-32 md:pt-36" aria-labelledby="contact-heading">
        <div className="grid items-center gap-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          {/* The print. Second on phones so the statement leads. */}
          <div className="relative order-2 mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:order-1">
            <PhotoPrint tilt={-5} attach="pin" mat="polaroid" caption="Big Quiv" lift="self" reveal={false} className="load-drop">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/hero/king-base-1024.webp"
                  alt="Big Quiv, founder of BigQuiv Digitals."
                  fill
                  priority
                  sizes="(max-width: 640px) 300px, 360px"
                  className="object-cover"
                  style={{ objectPosition: "51% 30%" }}
                />
              </div>
            </PhotoPrint>
            <Sticker
              shape="starburst"
              tone="gold"
              size={84}
              tilt={-14}
              reveal={false}
              className="load-settle absolute -left-7 top-10 sm:-left-10"
            />
            <Sticker
              shape="wavy"
              tone="soft"
              size={44}
              tilt={9}
              reveal={false}
              className="load-settle absolute -bottom-6 -right-4 sm:-right-10"
            >
              say hi
            </Sticker>
          </div>

          <div className="order-1 lg:order-2">
            <h1
              id="contact-heading"
              className="font-didone text-[clamp(3.4rem,8.6vw,6rem)] font-semibold leading-[0.92] tracking-[-0.012em] text-ink"
            >
              Let&apos;s build <Highlighter load delay={450}>something.</Highlighter>
            </h1>
            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-ink-soft md:text-xl">
              Whether you need an ordering system, a build, or the whole thing run for you, the first step is a
              conversation.
            </p>

            {/* The routes, as ruled rows on one framed card. */}
            <ul className="relative mt-10 border-[3px] border-ink bg-paper shadow-brutal-lg">
              {contactOptions.map((opt, i) => {
                const Icon = getIcon(opt.icon);
                return (
                  <li key={opt.title} className="border-b-[3px] border-ink last:border-b-0">
                    <a
                      href={opt.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid min-h-[76px] grid-cols-[4rem_1fr_auto] items-stretch transition-[background-color] duration-200 hover:bg-gold-tint focus-visible:bg-gold-tint sm:grid-cols-[4.75rem_1fr_auto]"
                    >
                      <span
                        aria-hidden="true"
                        className={cx("flex items-center justify-center border-r-[3px] border-ink", ROW_TONE[i % ROW_TONE.length])}
                      >
                        <Icon className="h-6 w-6 text-ink" strokeWidth={2.25} />
                      </span>
                      <span className="flex flex-col justify-center px-4 py-3 sm:px-6">
                        <span className="font-display text-[1.15rem] font-bold tracking-[-0.01em] text-ink sm:text-[1.3rem]">
                          {opt.title}
                        </span>
                        <span className="mt-0.5 whitespace-pre-line font-typewriter text-[12px] text-ink-soft [overflow-wrap:anywhere] sm:text-[14px]">
                          {opt.description}
                        </span>
                      </span>
                      <span aria-hidden="true" className="flex items-center pr-4 sm:pr-6">
                        <ArrowUpRight
                          className="h-6 w-6 text-ink transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          strokeWidth={2.5}
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {socialLinks.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-3" aria-label="Social profiles">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 border-2 border-ink bg-paper px-3.5 font-typewriter text-[13px] font-bold uppercase tracking-[0.06em] text-ink shadow-brutal-sm transition-[background-color,translate,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:bg-gold hover:shadow-[4px_4px_0_0_#111111]"
                    >
                      {link.name}
                      <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.75} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PaperSection>

      {/* ───────── 2. THE FORM ─────────
          A taped sheet on plain paper. Labels above every field, the focus
          ring from paper-scope, the fill goes gold-tint while you type. */}
      <PaperSection ground="paper" checker="top" pad="lg" width="mid" aria-labelledby="message-heading">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="relative">
            <SectionHead id="message-heading" title="Send a Message" size="md" />
            <HandNote
              arrow="down-right"
              arrowAt="below"
              tilt={-4}
              size="lg"
              className="mt-10 hidden lg:inline-flex"
              arrowClassName="ml-24"
            >
              say it plainly
            </HandNote>
          </div>

          {submitted ? (
            <div
              role="status"
              className="relative self-start border-[3px] border-ink bg-gold-tint p-8 shadow-brutal-lg sm:p-10"
              style={{ rotate: "-1deg" }}
            >
              <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-3} />
              <Sticker shape="starburst" tone="gold" size={76} tilt={14} className="absolute -right-6 -top-8" />
              <p className="font-didone text-[2.4rem] font-semibold leading-none text-ink">Message sent.</p>
              <p className="mt-4 text-lg text-ink-soft">I&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form
              action={`https://formsubmit.co/${formsubmitEmail}`}
              method="POST"
              onSubmit={() => setSubmitted(true)}
              className="relative border-[3px] border-ink bg-paper p-6 shadow-brutal-lg sm:p-9"
            >
              <Tape className="-top-3.5 left-10" tilt={-5} width={96} />
              <Tape className="-top-3.5 right-10" tilt={4} width={96} />

              <input type="hidden" name="_subject" value="New inquiry from bigquivdigitals.com" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_next" value="https://bigquivdigitals.com/contact" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={LABEL}>
                    Name
                  </label>
                  <input type="text" id="name" name="name" required autoComplete="name" placeholder="Your name" className={cx(FIELD, "h-[52px]")} />
                </div>

                <div>
                  <label htmlFor="email" className={LABEL}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={cx(FIELD, "h-[52px]")}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="service" className={LABEL}>
                  Service
                </label>
                <div className="relative">
                  <select id="service" name="service" required className={cx(FIELD, "h-[52px] cursor-pointer appearance-none pr-12")}>
                    <option value="" disabled>
                      Select a service
                    </option>
                    {serviceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center border-l-[3px] border-ink bg-gold"
                  >
                    <ChevronDown className="h-5 w-5 text-ink" strokeWidth={2.5} />
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="message" className={LABEL}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell me about your project or what you need help with..."
                  className={cx(FIELD, "resize-y py-3 leading-relaxed")}
                />
              </div>

              <div className="mt-8">
                <BrutalButton type="submit" size="lg" arrow={false} className="w-full sm:w-auto">
                  Send Message
                </BrutalButton>
              </div>
            </form>
          )}
        </div>
      </PaperSection>
    </div>
  );
}
