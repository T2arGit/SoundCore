# safe_push.ps1
# Guided safe commit & push script for GitHub beginners.
# Run from your project root: .\.agents\skills\github-setup\scripts\safe_push.ps1

param(
    [string]$Message = ""
)

function Write-Step { param($text) Write-Host "`n  $text" -ForegroundColor Cyan }
function Write-OK { param($text) Write-Host "  ✅ $text" -ForegroundColor Green }
function Write-Warn { param($text) Write-Host "  ⚠️  $text" -ForegroundColor Yellow }
function Write-Err { param($text) Write-Host "  ❌ $text" -ForegroundColor Red }

Write-Host "`n📦 Safe Push Helper" -ForegroundColor Magenta
Write-Host "────────────────────────────────────────"

# 1. Check we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Err "This folder is not a git repository! Run 'git init' first."
    exit 1
}

# 2. Show current branch
$branch = git branch --show-current
Write-Step "Current branch: '$branch'"

if ($branch -eq "main") {
    Write-Warn "You are on 'main'. It's safer to work on 'dev' and merge later."
    $answer = Read-Host "  Continue pushing to main anyway? (y/N)"
    if ($answer -ne "y") {
        Write-Host "`n  💡 To switch to dev branch:" -ForegroundColor Yellow
        Write-Host "     git checkout dev           (if dev already exists)"
        Write-Host "     git checkout -b dev        (create dev and switch to it)"
        exit 0
    }
}

# 3. Show what changed
Write-Step "Files changed:"
$status = git status --short
if (-not $status) {
    Write-OK "Nothing to commit — everything is already saved!"
    exit 0
}
$status | ForEach-Object { Write-Host "    $_" }

# 4. Ask for commit message if not provided
if ($Message -eq "") {
    Write-Host ""
    $Message = Read-Host "  📝 Describe your changes (commit message)"
    if ($Message -eq "") {
        Write-Err "Commit message cannot be empty."
        exit 1
    }
}

# 5. Add all and commit
Write-Step "Staging all changes..."
git add .
Write-Step "Creating commit..."
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-Err "Commit failed."
    exit 1
}
Write-OK "Commit created: `"$Message`""

# 6. Push
Write-Step "Pushing to GitHub (branch: $branch)..."
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-OK "Pushed successfully to GitHub! 🚀"
    Write-Host "  🔗 View at: $(git remote get-url origin)" -ForegroundColor DarkGray
    
    if ($branch -eq "dev") {
        Write-Host ""
        Write-Warn "When ready to publish to 'main', run:"
        Write-Host "  git checkout main" -ForegroundColor DarkGray
        Write-Host "  git merge dev" -ForegroundColor DarkGray
        Write-Host "  git push origin main" -ForegroundColor DarkGray
    }
}
else {
    Write-Err "Push failed. Check your internet connection or GitHub access."
}
