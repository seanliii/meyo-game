# GitHub Deploy

This repo can be pushed to your GitHub account, but the full game is **not**
just a static site. `GitHub Pages` can host only the landing page and client
assets; online accounts, WebSocket matches, saved progress, and Forge jobs
all need the Node server from this repo.

## What to push

Push the whole `mainline_compare/claude_of_legends_candidate_eval` directory
as one repository. Keep these files:

- `Dockerfile`
- `docker-compose.standalone.yml`
- `.env.example`
- `dist/` and `dist-server/` are rebuildable; they do not need to be committed
- `LICENSE`, `CREDITS.md`, and the source asset attributions must stay

Do **not** commit:

- `.env`
- `data/`
- any secret API keys

## Local full run

1. Copy `.env.example` to `.env`.
2. Set only the variables you really need. For a basic self-hosted game,
   `.env` can stay almost empty.
3. Run:

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

4. Open `http://localhost:8787`.

This gives you the real full stack: static client, API, WebSocket server, and
persistent `/app/data` state inside the Docker volume.

## Public deploy

For a public machine or platform VM:

1. Push this repo to GitHub.
2. Clone it on the server.
3. Copy `.env.example` to `.env`.
4. Set:

```bash
PUBLIC_URL=https://your-domain.example
HOST_PORT=8787
TRUST_PROXY=1
ALLOWED_ORIGINS=https://your-domain.example
```

5. Run:

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

6. Put Caddy, Nginx, or another reverse proxy in front of `localhost:8787`
   for HTTPS and `wss`.

## GitHub Pages caveat

If you only deploy the front end to GitHub Pages, you will **not** get:

- login
- online matchmaking
- persistence
- WebSocket multiplayer
- Forge generation endpoints

So the correct GitHub answer is:

- GitHub for source control: yes
- GitHub Pages for the full game: no
- GitHub repo + a real server/container host: yes
