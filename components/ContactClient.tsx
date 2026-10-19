"use client";

import { useState } from "react";
import Image from "next/image";
import { getIcon } from "@/lib/icons";
import { Stage } from "@/components/v3/stage/Stage";
import { CommentBubble } from "@/components/v3/fx/CommentBubble";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/contact.css";

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
 * /contact, v3 (rebuild approved 19 Oct 2026; comp: Contact.dc.html; motion:
 * MOTION-PLAN.md section 3).
 *
 * The form keeps its exact behaviour: the FormSubmit POST to the same action,
 * the same hidden fields, the same field names, ids and placeholders, HTML
 * validation, the same submitted state. Only its look changed: it reads as a
 * conversation (Comment Bubble, #12). Copy is the live page's, word for word.
 *
 * "What happens next" (#5 Checklist) lists the real flow after you get in
 * touch. Those four steps and their heading are the homepage's own process
 * copy (components/HomeClient.tsx STEPS), word for word; nothing is new.
 *
 * Stage: a calendar block flips to the booking day (scenes/calendar.ts).
 */

const NEXT_STEPS = [
  {
    t: "Scope call",
    d: "Thirty minutes. What you sell, who buys it, where people drop off. You leave with a plan whether or not you hire me.",
  },
  {
    t: "Written scope",
    d: "Deliverables and timeline in writing before anything starts, so nothing changes on you halfway through.",
  },
  {
    t: "Seven-day sprint",
    d: "Payment starts the work. At the end you get a report on what shipped and what moved.",
  },
  {
    t: "Build out",
    d: "We keep going in sprints, each one reported, until the system runs without me standing over it.",
  },
];

function Ask({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="v3-chat__ask">
      {children}
    </label>
  );
}

export function ContactClient({ contactOptions, socialLinks, serviceOptions, formsubmitEmail }: ContactClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const booking = contactOptions.find((o) => /book a call/i.test(o.title));

  return (
    <div className="v3 v3-contact">
      {/* ───────── STAGE: the calendar flips to the booking day ───────── */}
      <Stage
        scene="calendar"
        params={{ note: booking?.description ?? "" }}
        ground="navy"
        height={560}
        heightPhone={480}
        mark="LET'S BUILD"
        label="Contact"
      >
        <div className="v3-intro">
          <h1 id="contact-heading" className="v3-intro__line v3-display v3-contact__h1" data-lift>
            Let&apos;s build <span className="mark">something.</span>
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-contact__intro">
              <p className="v3-contact__sub">
                Whether you need an ordering system, a build, or the whole thing run for you, the first step is a
                conversation.
              </p>
              {booking && (
                <div className="v3-intro__actions">
                  <a href={booking.href} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--lg">
                    {booking.title} <Arrow />
                  </a>
                </div>
              )}
            </div>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        <p className="v3-ghost" data-ghost="0.1,0.14,0.22,0.26" data-side="left" aria-hidden="true">
          Let&apos;s build something.
        </p>
        {booking && (
          <>
            <p className="v3-ghost" data-ghost="0.28,0.33,0.44,0.48" data-side="left" aria-hidden="true">
              {booking.title}
            </p>
            <p className="v3-ghost v3-contact__beat" data-ghost="0.5,0.55,0.65,0.69" data-side="left" aria-hidden="true">
              {booking.description}
            </p>
          </>
        )}
        <p className="v3-ghost" data-ghost="0.72,0.77,0.86,0.9" data-side="left" aria-hidden="true">
          Send a Message
        </p>

        <div className="v3-endcta" data-at="0.91,0.95,1.1,1.2">
          {booking && (
            <a href={booking.href} target="_blank" rel="noopener noreferrer" className="v3-btn">
              {booking.title} <Arrow />
            </a>
          )}
          <a href="#message-heading" className="v3-link">
            Send a Message
          </a>
        </div>
      </Stage>

      {/* ───────── THE ROUTES ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-label="Ways to reach me">
        <div className="v3-wrap v3-contact__routes">
          <figure className="v3-contact__photo">
            <p className="v3-hand v3-contact__hand" aria-hidden="true">
              say hi
            </p>
            <div className="v3-contact__photo-frame" data-reveal="clip">
              <Image
                src="/hero/king-base-1024.webp"
                alt="Big Quiv, founder of BigQuiv Digitals."
                fill
                sizes="(max-width: 900px) 92vw, 560px"
                style={{ objectFit: "cover", objectPosition: "51% 30%" }}
              />
            </div>
            <figcaption>Big Quiv</figcaption>
          </figure>

          <div>
            <ul className="v3-contact__list">
              {contactOptions.map((opt) => {
                const Icon = getIcon(opt.icon);
                return (
                  <li key={opt.title} data-fade>
                    <a href={opt.href} target="_blank" rel="noopener noreferrer" className="v3-contact__row">
                      <Icon aria-hidden="true" className="v3-contact__icon" strokeWidth={1.75} />
                      <span>
                        <span className="v3-contact__t">{opt.title}</span>
                        <span className="v3-contact__d">{opt.description}</span>
                      </span>
                      <Arrow className="v3-contact__arrow" />
                    </a>
                  </li>
                );
              })}
            </ul>
            {socialLinks.length > 0 && (
              <ul className="v3-contact__social" aria-label="Social profiles">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ───────── SEND A MESSAGE: the form as a conversation ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="message-heading">
        <div className="v3-wrap v3-contact__send">
          <div className="v3-contact__side" data-checklist>
            <h2 id="message-heading" className="v3-h2 v3-display" data-split>
              Send a Message
            </h2>
            <div className="v3-contact__next">
              <div className="v3-contact__next-head">
                <h3 className="v3-h3">Seven days to your first report.</h3>
                <span className="v3-contact__count" aria-hidden="true" data-check-count>
                  0 of 4
                </span>
              </div>
              <ol>
                {NEXT_STEPS.map((s) => (
                  <li key={s.t} data-check>
                    <span className="v3-contact__step-t">{s.t}</span>
                    <span className="v3-contact__step-d">{s.d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {submitted ? (
            <div role="status" className="v3-chat v3-chat--done">
              <div className="v3-chat__reply">
                <p className="v3-chat__reply-t">Message sent.</p>
                <p>I&apos;ll get back to you within 24 hours.</p>
              </div>
            </div>
          ) : (
            <CommentBubble className="v3-chat">
              <form action={`https://formsubmit.co/${formsubmitEmail}`} method="POST" onSubmit={() => setSubmitted(true)}>
                <input type="hidden" name="_subject" value="New inquiry from bigquivdigitals.com" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_next" value="https://bigquivdigitals.com/contact" />

                <div className="v3-chat__row" data-bubble>
                  <Ask htmlFor="name">Name</Ask>
                  <input type="text" id="name" name="name" required autoComplete="name" placeholder="Your name" className="v3-chat__field" />
                </div>

                <div className="v3-chat__row" data-bubble>
                  <Ask htmlFor="email">Email</Ask>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="v3-chat__field"
                  />
                </div>

                <div className="v3-chat__row" data-bubble>
                  <Ask htmlFor="service">Service</Ask>
                  <div className="v3-chat__select">
                    <select id="service" name="service" required className="v3-chat__field">
                      <option value="" disabled>
                        Select a service
                      </option>
                      {serviceOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5.5 8 4.5 4.5L14.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                    </svg>
                  </div>
                </div>

                <div className="v3-chat__row" data-bubble>
                  <Ask htmlFor="message">Message</Ask>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell me about your project or what you need help with..."
                    className="v3-chat__field v3-chat__area"
                    data-bubble-type
                  />
                </div>

                <div className="v3-chat__send" data-bubble>
                  <button type="submit" className="v3-btn v3-btn--lg">
                    Send Message <Arrow />
                  </button>
                </div>
              </form>
            </CommentBubble>
          )}
        </div>
      </section>
    </div>
  );
}
