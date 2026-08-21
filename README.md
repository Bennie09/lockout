# Lockout

A small Android app, built for **Expo Go**, that puts friction between you and the apps you keep opening.

Lockout does not lecture. It closes the door, then makes picking the lock take long enough that you can notice you are picking it.

## What it does

- **Connect apps** — Instagram, TikTok, YouTube, X, Snapchat, Facebook, Reddit, WhatsApp, Discord, Pinterest
- **Per-app lockout windows** — as many as you want (12:00 AM–7:00 AM, 3:00 PM–4:00 PM, …)
- **Universal lockout** — one schedule that covers every connected app
- **Daily caps** — e.g. 2 hours on TikTok, then it is treated as locked until midnight
- **Locked-out screen** — if you try to open an app during a window, Lockout stops you
- **The long lock** — changing hours while a lockout is running asks for, in order:
  1. Fingerprint / face (or a 3-second hold on devices without a sensor)
  2. 6-digit PIN
  3. Password
  4. Secret word
  5. “Why do you want to open this?” (80+ characters)
  
  Forced waits sit between the gates so the whole thing takes a few minutes on purpose.

## Run it on your phone (Expo Go)

1. Install [Expo Go](https://expo.dev/go) on Android.
2. In this folder:

```bash
npm install
npx expo start
```

3. Scan the QR code with Expo Go.

Onboarding is required once: pick apps, set PIN / password / word, optionally turn on a 12 AM–7 AM night lockout.

**You → Preview lockout** and **Preview the long lock** let you see those screens without waiting for a window.

**You → Fast demo usage** makes 1 second in a session count as 1 minute so daily caps are easy to test.

## Expo Go vs a store build

Expo Go can run the full Lockout UI, timers, sessions, and the long lock. It **cannot** force-close Instagram from outside this app — that needs a later Android build with usage-access / accessibility. Until then, start a **session** from an app page to feel the lock.

The padlock mark is the Lucide `lock` icon (ISC): [lock.svg](https://github.com/lucide-icons/lucide/blob/main/icons/lock.svg).

## Scripts

```bash
npm start          # Expo Go
npm run typecheck  # TypeScript
npm run web        # Browser preview
```
