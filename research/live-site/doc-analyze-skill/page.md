# The /analyze Skill: Workflow | BigQuiv Digitals

- URL: https://bigquivdigitals.com/doc/analyze-skill
- HTTP status: 200
- Fetched: 2026-10-19 with Scrapling MCP (JS rendered)
- Meta description: Thank you for commenting. This is the skill I use to break down any viral video. Paste a link. Claude pulls the real numbers, the real words and the real…

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

ANALYZE

The /analyze Skill: Workflow
============================

From: /analyze skill

start here

Thank you for commenting.

This is the skill I use to break down any viral video.

Paste a link.

Claude pulls the real numbers, the real words and the real frames.

Then it tells you why the video worked, and hands you a template to make your own.

I used it to score 128 videos in one day for my last research.

It works on:

→ Instagram Reels

→ TikTok

→ YouTube and YouTube Shorts

→ any video file on your laptop

Everything it uses is free.

---

What you get back
-----------------

→ **The real numbers.** Views, likes, comments, shares.

→ **An outlier score.** How many times better this video did than the creator's normal. A 10x video is worth studying. A 1x video is not.

→ **The real transcript.** Made on your own laptop, word for word.

→ **Real frames.** The first 3 seconds and every scene change, so it reads what is actually on screen.

→ **The breakdown.** The hook, the structure, why people stayed, the visual layout.

→ **A template.** The same video, rebuilt as a fill-in-the-blanks plan for your niche.

Give it 2 or more links and it also tells you the pattern they all share.

---

You need
--------

→ Claude Code (Anthropic's coding app)

→ About 15 minutes to set it up once

---

Step 1: Install the tools
-------------------------

These download the video, read the sound and pull the frames.

**On Windows**, open PowerShell and run these one by one:

Copy

```
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
winget install Python.Python.3.12
pip install faster-whisper
```

**On Mac**, open Terminal and run:

Copy

```
brew install yt-dlp ffmpeg python
pip3 install faster-whisper
```

Close the window and open a new one. Then check both work:

Copy

```
yt-dlp --version
ffmpeg -version
```

---

Step 2: Install Scrapling
-------------------------

This is what reads Instagram.

Likes, comments, view counts, and the live comment list.

No login. No credits.

Copy

```
pip install "scrapling[ai]"
scrapling install
```

Now find where it installed.

Windows:

Copy

```
where scrapling-mcp
```

Mac:

Copy

```
which scrapling-mcp
```

Copy the path it shows you, and connect it to Claude Code:

Copy

```
claude mcp add --scope user scrapling -- "PASTE THE PATH HERE"
```

---

Step 3: Download the skill
--------------------------

[Download the /analyze skill (analyze-skill.zip)](/docs/analyze/analyze-skill.zip)

Unzip it so the folder sits here:

→ **Windows:** C:\Users\YOUR NAME\.claude\skills\analyze\

→ **Mac:** your home folder, then .claude/skills/analyze/

Inside that folder you should see **SKILL.md** and a **scripts** folder.

---

Step 4: Set your browser
------------------------

Instagram only gives the video file to a browser that is logged in.

The skill is set to **Brave**.

If you use another browser, open SKILL.md, search for this line:

Copy

```
--cookies-from-browser brave
```

Change **brave** to **firefox**, **edge**, **chrome** or **safari**.

Stay logged in to Instagram in that browser.

What worked on my Windows laptop:

→ Brave works

→ Firefox works

→ Edge only works when it is fully closed

→ Chrome often fails

Your login stays on your laptop. Nothing is sent anywhere.

---

Step 5: Use it
--------------

Restart Claude Code and type:

Copy

```
/analyze https://www.instagram.com/reel/PASTE-THE-CODE/
```

For a pattern report, paste several links in one message.

---

If something goes wrong
-----------------------

**TikTok times out.** Run it again. It retries with a longer wait.

**"Instagram sent an empty media response."** Your browser is not logged in, or the browser name in Step 4 is wrong.

**The transcript is empty.** The video has no talking. Only music or text. That is a real answer, not an error.

**The transcript is slow.** That is on purpose. Faster settings mishear words, and a misheard hook ruins the whole breakdown.

---

Want the whole system?
----------------------

This is one tool out of many I use to make content with AI.

I'm putting all of it into my AI masterclass:

→ How to write prompts AI actually understands

→ The full creative director system I use

→ How to make AI videos people pay for

It's free for the first 100 people.

[Join the AI masterclass waitlist](https://bigquivdigitals.com/aimastery-waitlist?src=doc-analyze)

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
