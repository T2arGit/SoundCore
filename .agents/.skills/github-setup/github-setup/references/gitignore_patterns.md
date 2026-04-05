# Common .gitignore Patterns by Stack

## Universal (always include)

```
.DS_Store
Thumbs.db
desktop.ini
*.log
logs/
*.tmp
```

## Local runtime / scratch files (review before applying)

```
.neira_runtime/
brain/
about_build.md
```

Do **not** blindly ignore `.agents/`, `.agents/skills/`, `neira/skills/`, or `.deepagents/`.
Some agent-driven repositories intentionally commit those directories.

## Node.js / Vite / React

```
node_modules/
dist/
dist-ssr/
.env.local
*.local
```

## Rust / Tauri

```
target/
src-tauri/target/
src-tauri/binaries/
src-tauri/gen/
```

## Python

```
.venv/
__pycache__/
*.pyc
build/
dist/
*.egg-info/
.pytest_cache/
```

## Environment Variables

```
.env
.env.*
!.env.example
```
