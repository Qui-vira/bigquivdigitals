# How I Use AI for Client Work: Full Process | BigQuiv Digitals

- URL: https://bigquivdigitals.com/doc/ai-client-work-guide
- HTTP status: 200
- Fetched: 2026-10-19 with Scrapling MCP (JS rendered)
- Meta description: You saw the video. 4 hours. $2,500. Production-ready app. Here is exactly how I use AI to ship client projects at 10x speed without sacrificing quality.

---

## Rendered page (markdown, verbatim from the live page)
[Skip to content](#main)[BigQuiv Digitals](/)

* [Services](/services)
* [Articles](/articles)
* [About](/about)
* [Work](/portfolio)
* [UGC](/ugc)
* [Contact](/contact)

[Book a Call](https://calendly.com/_quivira/one-on-one-meeting)

[All Articles](/articles)

BUILD

How I Use AI for Client Work: Full Process
==========================================

From: 4 Hours. $2,500. I Didn't Tell Them.

start here

You saw the video. 4 hours. $2,500. Production-ready app. Here is exactly how I use AI to ship client projects at 10x speed without sacrificing quality.

---

The Mindset Shift
-----------------

You are not charging for hours. You never were. You are charging for:

* Knowing WHAT to build
* Knowing HOW to structure it
* Shipping it FAST and CLEAN
* It WORKING on day one

The client does not care if it took you 4 hours or 40. They care that it works.

---

My Stack
--------

| Tool | Role |
| --- | --- |
| **Claude Code** | Primary coding partner. Writes 70-80% of initial code from my architecture decisions. |
| **VS Code** | Editor. I review, refactor, and test everything Claude generates. |
| **Vercel / Railway** | Deployment. Ship same day. |
| **Supabase** | Database + auth. Fastest backend setup. |

---

The Process (Step by Step)
--------------------------

### Phase 1: Scope (30 minutes)

Before I touch any code, I define exactly what the client needs.

1. Break the project into features (not pages, features)
2. Write a one-paragraph spec for each feature
3. Identify the data model (what tables, what relationships)
4. Decide the tech stack (Next.js + Supabase for 90% of projects)
5. Estimate: is this a 2-hour build or a 6-hour build?

This phase is where your VALUE lives. AI cannot do this. You decide what gets built. You decide what gets cut. You decide the architecture. This is what clients pay $2,500 for.

### Phase 2: Build (2-3 hours)

This is where Claude Code does the heavy lifting.

**How I prompt Claude Code for client work:**

1. Start with the data model. I describe the tables, columns, and relationships. Claude generates the Supabase migration.
2. Build one feature at a time. I describe what the feature does in plain English. Claude writes the implementation. I review every file before moving on.
3. Never let Claude make architecture decisions. I tell it: "Use server components for this page. Client component for the form. Server action for the mutation." It executes. I decide.
4. Refactor as you go. After Claude writes a feature, I read through it. If something is over-engineered or unclear, I refactor immediately. Do not accumulate tech debt.
5. Test in real time. After each feature, I run it locally. Click through it. Break it. Fix what breaks before moving to the next feature.

**Example prompt I use:**

Copy

```
Build a dashboard page at /admin that shows:
- Total users (count from profiles table)
- Revenue this month (sum from payments table where created_at > start of month)
- Recent signups (last 10 from profiles, show name + email + date)

Use server components. Fetch data with Supabase server client.
Style with Tailwind. Dark theme. Card layout.
```

Claude generates the page. I review it. Ship it.

### Phase 3: Deploy (30 minutes)

1. Push to GitHub
2. Connect to Vercel (frontend) or Railway (backend/cron)
3. Set environment variables
4. Deploy
5. Test the live URL
6. Send the client the link

### Phase 4: Deliver (15 minutes)

1. Record a 2-minute Loom walkthrough showing the app working
2. Send to client with the live URL
3. Ask if anything needs adjusting
4. Invoice immediately

---

What AI Cannot Do (This Is Your Value)
--------------------------------------

* AI cannot scope a project correctly. It builds what you tell it. If you tell it wrong, it builds wrong.
* AI cannot make product decisions. "Should we add auth?" "Should this be real-time?" "Do we need a mobile view?" You decide.
* AI cannot talk to the client. You translate "I want something like Notion but for my team" into a real spec.
* AI cannot test like a user. You click through the app and find the edge cases.
* AI cannot deploy and configure hosting. You set up the infra.

The 20% that AI cannot do is 100% of your value. That is why you charge the same rate.

---

Billing Strategy
----------------

| Old Way | New Way |
| --- | --- |
| Charge hourly ($50-100/hr) | Charge per project ($1,500-5,000) |
| 40 hours = $4,000 | 4 hours = $2,500 |
| Client sees hours, negotiates | Client sees working app, pays |
| Punish yourself for speed | Reward yourself for speed |

**Rules:**

* Never quote hourly. Always quote per project.
* Never tell the client how long it took. They did not ask.
* Deliver faster than promised. Always.
* Use the time saved to take more clients or build your own products.

---

Weekly Client Capacity
----------------------

Before AI: 1 client project per week (40-50 hours)

After AI: 3-4 client projects per week (4-6 hours each)

Same quality. Same satisfaction. 3-4x the revenue.

---

Common Objections (From Your Own Brain)
---------------------------------------

**"Is this ethical?"**

Yes. You are paid for the result, not the process. A surgeon who finishes faster is better, not worse.

**"What if the client finds out?"**

Finds out what? That you used a tool? Every developer uses tools. Nobody hand-writes assembly anymore. AI is the next compiler.

**"Am I still a real developer?"**

You decided the architecture. You reviewed every line. You tested it. You deployed it. You talked to the client. You are the developer. The AI is your tool.

---

Start This Week
---------------

1. Pick one client project you are currently working on
2. Open Claude Code
3. Describe one feature in plain English
4. Let it generate. Review. Refactor. Test.
5. Track how long it actually takes vs how long you quoted
6. Keep the difference. That is your leverage.

Stop selling hours. Start selling outcomes.

Quiv (@big\_quiv)

By[@big\_quiv](https://x.com/_Quivira)

[All Articles](/articles)

[BigQuiv  
Digitals](/)

Growth systems that turn attention into revenue. Website, AI content, community, strategy and reporting, built as one.

Pages
-----

* [Services](/services)
* [About](/about)
* [Work](/portfolio)
* [UGC](/ugc)
* [Contact](/contact)
* [The Great Work Waitlist](/greatwork-waitlist)
* [AI Mastery Waitlist](/aimastery-waitlist)

Social
------

* [X (Twitter)](https://x.com/_Quivira)
* [LinkedIn](https://linkedin.com/in/bigquiv)
* [TikTok](https://tiktok.com/@big_quiv)
* [Instagram](https://instagram.com/big_quiv)
* [Telegram](https://t.me/Quivira_Ophir)

Contact
-------

* [contact@bigquivdigitals.com](mailto:contact@bigquivdigitals.com)
* [Telegram: @Quivira\_Ophir](https://t.me/Quivira_Ophir)
* [Book a Call](https://calendly.com/_quivira/one-on-one-meeting)

© 2026 BigQuiv Digitals. All rights reserved.

[back to top](#top)

---

## Interactive elements (from the rendered HTML)

### Buttons (rendered `<button>` elements)
- "" (type=`button`, aria-label=`Open menu`)
- "Copy" (type=`button`)
