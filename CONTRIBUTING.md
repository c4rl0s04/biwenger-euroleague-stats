# Contributing

This is a personal portfolio project built and maintained by one person. That said, if you've found it useful or spotted something to improve, contributions are welcome.

## Found a bug?

Open an [issue](https://github.com/c4rl0s04/biwengerstats-next/issues) using the bug report template. Include steps to reproduce and what you expected to happen.

## Got a feature idea?

Open an issue with the `enhancement` label. Happy to discuss it.

## Want to submit a PR?

1. Fork the repo and create a branch (`feature/my-idea` or `fix/the-bug`)
2. Make your changes
3. Ensure tests pass: `npm test -- --run`
4. Ensure formatting is clean: `npm run format`
5. Open a PR — the template will guide you through the checklist

## Running locally

```bash
git clone https://github.com/c4rl0s04/biwengerstats-next.git
cd biwengerstats-next
npm install
cp .env.example .env
npm run setup   # interactive setup wizard
npm run dev
```

See [`README.md`](./README.md) for the full setup guide.
