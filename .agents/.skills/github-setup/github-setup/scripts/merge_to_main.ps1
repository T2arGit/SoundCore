# merge_to_main.ps1
# Safely merges dev branch into main and pushes to GitHub.
# Run from project root: .\.agents\skills\github-setup\scripts\merge_to_main.ps1

function Write-Step { param($text) Write-Host "`n  $text" -ForegroundColor Cyan }
function Write-OK { param($text) Write-Host "  ✅ $text" -ForegroundColor Green }
function Write-Warn { param($text) Write-Host "  ⚠️  $text" -ForegroundColor Yellow }
function Write-Err { param($text) Write-Host "  ❌ $text" -ForegroundColor Red }

Write-Host "`n🔀 Merge dev → main" -ForegroundColor Magenta
Write-Host "────────────────────────────────────────"

# 1. Check we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Err "Not a git repository!"
    exit 1
}

# 2. Check current branch
$branch = git branch --show-current
if ($branch -ne "dev") {
    Write-Warn "You are on '$branch', not 'dev'."
    $answer = Read-Host "  Switch to dev first? (Y/n)"
    if ($answer -ne "n") {
        git checkout dev
    }
}

# 3. Make sure dev is up to date (push any uncommitted changes first)
$status = git status --short
if ($status) {
    Write-Warn "You have uncommitted changes in dev:"
    $status | ForEach-Object { Write-Host "    $_" }
    $answer = Read-Host "  Commit them now before merging? (Y/n)"
    if ($answer -ne "n") {
        $msg = Read-Host "  Commit message"
        git add .
        git commit -m $msg
        git push origin dev
        Write-OK "Changes committed and pushed to dev."
    }
}

# 4. Save current main commit (for rollback reference)
git checkout main | Out-Null
$prevMainHash = git rev-parse HEAD
Write-Step "Current main commit (for rollback): $prevMainHash"

# 5. Merge dev into main
Write-Step "Merging dev into main..."
git merge dev --no-ff -m "Merge dev into main"

if ($LASTEXITCODE -ne 0) {
    Write-Err "Merge conflict! Resolve conflicts manually, then:"
    Write-Host "  git add ." -ForegroundColor DarkGray
    Write-Host "  git commit -m 'Resolve merge conflicts'" -ForegroundColor DarkGray
    Write-Host "  git push origin main" -ForegroundColor DarkGray
    exit 1
}

# 6. Push main
Write-Step "Pushing main to GitHub..."
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-OK "main updated on GitHub! 🚀"
    Write-Host ""
    Write-Host "  💡 To rollback main to previous state:" -ForegroundColor DarkGray
    Write-Host "     git checkout main" -ForegroundColor DarkGray
    Write-Host "     git revert HEAD" -ForegroundColor DarkGray
    Write-Host "     (or hard reset to: $prevMainHash)" -ForegroundColor DarkGray
}
else {
    Write-Err "Push failed."
}

# 7. Return to dev
git checkout dev | Out-Null
Write-OK "Back on dev branch. Keep working!"
