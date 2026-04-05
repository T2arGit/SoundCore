#!/usr/bin/env python3
"""
check_gitignore.py
Автоматически определяет стек проекта и гарантирует, что важные пути добавлены в .gitignore.
Добавляет файлы AI-агентов, тяжелые зависимости и артефакты сборки.
"""
import os
import argparse
from pathlib import Path

# --- Локальная среда / временные файлы, которые обычно безопасно исключать ---
AGENT_PATTERNS = [
    "# Локальная среда Агента",
    ".neira_runtime/",
    "brain/",
    "about_build.md",
    "*.tmp",
]

# --- Паттерны для стеков ---
STACK_PATTERNS = {
    "node": {
        "detect": ["package.json"],
        "patterns": [
            "# Node.js / Electron / Vite",
            "node_modules/",
            "dist/",
            "out/",
            "dist-ssr/",
            ".env.local",
            "*.local",
            ".env.development.local",
            ".env.test.local",
            ".env.production.local",
        ]
    },
    "rust_tauri": {
        "detect": ["src-tauri/Cargo.toml", "Cargo.toml"],
        "patterns": [
            "# Rust / Tauri",
            "src-tauri/target/",
            "target/",
            "src-tauri/binaries/",
            "src-tauri/gen/",
        ]
    },
    "python": {
        "detect": ["requirements.txt", "pyproject.toml", "setup.py"],
        "patterns": [
            "# Python",
            ".venv/",
            "__pycache__/",
            "*.pyc",
            "*.pyo",
            "dist/",
            "build/",
            "*.egg-info/",
            ".pytest_cache/",
        ]
    },
    "dotenv": {
        "detect": [".env"],
        "patterns": [
            "# Environment",
            ".env",
            ".env.*",
            "!.env.example",
        ]
    },
    "logs": {
        "detect": [],  # всегда добавлять
        "patterns": [
            "# Logs",
            "*.log",
            "logs/",
        ]
    },
    "os": {
        "detect": [],  # всегда добавлять
        "patterns": [
            "# OS",
            ".DS_Store",
            "Thumbs.db",
            "desktop.ini",
        ]
    },
    "user_data": {
        "detect": ["user_data/"],
        "patterns": [
            "# Local user data",
            "user_data/",
        ]
    }
}


def load_gitignore(path: Path) -> list[str]:
    if path.exists():
        return path.read_text(encoding="utf-8").splitlines()
    return []


def pattern_in_file(pattern: str, lines: list[str]) -> bool:
    """Проверяет, присутствует ли паттерн (игнорируя комментарии и пробелы) в файле."""
    clean = pattern.strip().lstrip("!")
    for line in lines:
        if line.strip().lstrip("!") == clean:
            return True
    return False


def detect_stacks(project_root: Path) -> list[str]:
    stacks = ["logs", "os"]  # всегда включены
    for stack, cfg in STACK_PATTERNS.items():
        if stack in ("logs", "os"):
            continue
        for indicator in cfg["detect"]:
            if (project_root / indicator).exists():
                stacks.append(stack)
                break
    return stacks


def update_gitignore(project_root: Path):
    gitignore_path = project_root / ".gitignore"
    lines = load_gitignore(gitignore_path)
    added = []

    def add_block(block_patterns):
        nonlocal lines, added
        block_to_add = []
        for p in block_patterns:
            if not p.startswith("#") and not pattern_in_file(p, lines):
                block_to_add.append(p)
        if block_to_add:
            lines.append("")
            lines.extend(block_patterns)
            added.extend(block_to_add)

    # 1. Паттерны ИИ-агента (всегда)
    add_block(AGENT_PATTERNS)

    # 2. Специфичные для стека
    stacks = detect_stacks(project_root)
    print(f"  Обнаруженные стеки: {', '.join(stacks)}")
    for stack in stacks:
        add_block(STACK_PATTERNS[stack]["patterns"])

    if added:
        gitignore_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"\n✅ Добавлено {len(added)} паттернов в .gitignore:")
        for p in added:
            print(f"   + {p}")
    else:
        print("\n✅ .gitignore уже актуален. Ничего не добавлено.")

    print(f"\n📄 Путь к .gitignore: {gitignore_path}")


def main():
    parser = argparse.ArgumentParser(description="Автоматическое обновление .gitignore для проекта.")
    parser.add_argument("--path", default=".", help="Путь к корню проекта")
    args = parser.parse_args()

    project_root = Path(args.path).resolve()
    print(f"🔍 Сканирование проекта: {project_root}\n")
    update_gitignore(project_root)


if __name__ == "__main__":
    main()
