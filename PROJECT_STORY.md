## Inspiration

## Inspiration

We've all been there—starting with exciting new goals, only to find them drifting away as life gets busy. It’s a shared human experience, and it’s perfectly natural. The truth is, building new habits is a journey, and it's always easier when we do it together.

The challenge usually isn't a lack of effort; often, it's just that our ambitions are big and the path isn't always clear. "Get healthy" is a wonderful aspiration, but without a specific roadmap, it's easy to feel a bit lost. And in those moments when we need a boost, we don't need a critic—we need a friend to say, "You've got this. Let's just do 5 minutes today."

That's why we built this. We wanted to encounter more than just a tool; we wanted to create a **supportive partner** for your journey. An AI that acts like a true ally—someone who helps clarify your vision, handles the setup for you, and celebrates every small win along the way. We believe self-improvement shouldn't feel like a chore; it should feel like a co-op game where you have a teammate always cheering you on.

## What it does

"Your Coach" is basically a factory for self-improvement. It doesn't just chat; it **builds a custom app experience** for you in seconds.

1.  **It shrinks the scope:** You come in with a big, scary goal like "Write a Novel." The AI (our "Scope Shrinker" agent) talks you down and says, "Okay, let's start with writing 100 words a day."
2.  **It builds the tools:** It automatically generates a custom database schema for your goal. If you're running, it creates fields for "Distance" and "Time". If you're meditating, it tracks "Minutes" and "Focus Level." You don't drag-and-drop anything; the AI just *does* it.
3.  **It gives you a personality:** It crafts a unique Coach Persona. Maybe you need a Drill Sergeant to yell at you, or maybe you need a "Supportive Grandma" who calls you "dear." The AI generates this persona (bio, voice, motto) and sticks to it.
4.  **It analyzes & improves:** It doesn't just record numbers; it tracks your *trajectory*. The coach analyzes your progress and proactively suggests specific ways to improve, helping you adjust your strategy to actually reach your goal.

Once your coach is born, you just chat. You log your day, and the coach updates your stats, analyzes your trends, and offers concrete advice to keep you moving toward your goal.

## How we built it

We went all-in on the **Gemini 3.0 Flash** model. Speed was everything—we didn't want users waiting 10 seconds for their coach to reply.

-   **The Brains:** Gemini 3.0 Flash via the Google GenAI SDK. We leaned heavily on structured JSON output to control the UI. When the coach decides ask you for data, it doesn't just send text; it sends a UI schema.
-   **The Skeleton:** React for the frontend, Fastify (Node.js) for the backend. We used a simple SQLite database for development to keep things moving fast.
-   **The Agents:** We used a multi-agent architecture. One agent figures out *what* to track, another figures out *who* the coach should be, and another handles the daily conversation.
-   **The Vibe:** We used **Lovable** to prototype the UI quickly because we wanted it to look sleek without spending days on CSS. And we utilized **Antigravity** (an agentic coding assistant) to handle the heavy lifting of boilerplate code, allowing us to focus on the creative logic.

## Challenges we ran into

**1. The "Goldfish Memory" Problem**
Standard AI chats are great at the moment, but terrible at remembering *context* over time. Our biggest pain point was that the AI would simply "forget" what we were tracking. One day it's tracking "kms run," the next it's asking "how was your walk?" without recording the data. We had to build a robust "Contextual Memory" system to force the AI to remember your specific protocols.

**2. Tracking is Hard (Unstructured vs. Structured)**
Normal AI interaction is just text-in, text-out. It loves to chat, but it doesn't naturally "think" in spreadsheets or database rows.
-   **The Challenge:** How do you turn a casual sentence like "I ran a quick 5k this morning" into a precise tracking entry (Activity: Running, Distance: 5km) without the AI just nodding along?
-   **The Struggle:** We spent hours wrestling with the prompt to stop the AI from just being a supportive friend ("Good job!") and start being a diligent clerk ("Data saved."). It was a constant battle to get it to output clean, parsable data without losing its personality.

**3. Making specific, general**
 It's easy to hard-code a fitness tracker. It's HARD to make a tracker that works for *anything*—from knitting to stock trading to meditation. Balancing that flexibility while keeping the UI usable was a huge design challenge.

## Accomplishments that we're proud of

-   **Solving our own pain point:** One of us has been using Gemini to track and analyze running performance for over 6 months already. It was helpful, but the "context amnesia" was a constant struggle—without memory, the advice was generic. Building this app solved that. We proved that when you give AI long-term context, it stops being just a chatbot and starts being a genuine performance coach.
-   **Mastering "Vibe Coding":** This project was a masterclass in AI direction. We learned to leverage our traditional Software Engineering skills to structure the *prompts* and *architecture* effectively. We didn't just "ask" Gemini to work; we engineered an environment where it *could* work brilliantly. Seeing that blend of human engineering and AI creativity produce such a polished result is incredibly satisfying.

## What we learned

-   **"Vibe Coding" is real.** We realized that with AI tools like Gemini and Antigravity, we essentially became "Product Managers who code." We spent less time formatting strings and more time asking "How should this *feel*?"
-   **Latency matters more than IQ.** For a chat interface, Gemini 3.0 Flash was perfect. The user needs an instant reply to feel connected. A smarter model that takes 5 seconds to think breaks the immersion.
-   **Structure is King.** The biggest breakthrough was when we stopped asking the AI for text and started asking for structured objects. It turns the LLM into a backend engine, not just a writer.

## What's next for Your Coach

We have a massive wish list to make this even better (currently out of scope, but dreaming big):

-   **Fine tuning the prompt:** To make the coaches feel even more distinct and consistent.
-   **Image support: OCR:** Imagine snapping a pic of your meal or your sketchbook, and the coach automatically logging it.
-   **True Bring-Your-Own-Key:** Allowing users to plug in their own subscription for unlimited coaching.
-   **Export data:** Letting users download their hard-earned tracked data to Google Sheets or CSV.
-   **Ethics and countermeasures:** Better guardrails to ensure the coaching remains healthy and positive.
-   **Gamification:**
    -   **Coach Evolution:** Logging X days in a row to "level up" your coach, unlocking advanced charts and features.
-   **Collaboration:** Sharing data between coaches or even having multi-user challenges.
-   **Calendar integration:** pushing action items directly to your real-world schedule.
-   **Quality of Life:** Configuring the coach *after* creation (e.g., tweaking their personality if they're too mean).