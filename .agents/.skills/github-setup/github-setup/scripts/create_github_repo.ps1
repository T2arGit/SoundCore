# create_github_repo.ps1
# Creates a new GitHub repository via API and links the local repo
# Usage: .\create_github_repo.ps1 -RepoName "my-project" -Private $true -Pat "ghp_xxxx"

param(
    [Parameter(Mandatory=$true)]  [string]$RepoName,
    [Parameter(Mandatory=$false)] [bool]$Private = $true,
    [Parameter(Mandatory=$true)]  [string]$Pat,
    [Parameter(Mandatory=$false)] [string]$Description = ""
)

$Headers = @{
    "Authorization" = "token $Pat"
    "Content-Type"  = "application/json"
    "User-Agent"    = "PowerShell"
}

$Body = @{
    name        = $RepoName
    private     = $Private
    description = $Description
    auto_init   = $false
} | ConvertTo-Json

Write-Host "📡 Creating repository '$RepoName' on GitHub..." -ForegroundColor Cyan

try {
    $Response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
        -Method POST -Headers $Headers -Body $Body

    $CloneUrl = $Response.clone_url
    $HtmlUrl  = $Response.html_url

    Write-Host "✅ Repository created: $HtmlUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Linking local repo to GitHub..." -ForegroundColor Cyan

    # Check if remote already exists
    $Existing = git remote get-url origin 2>$null
    if ($Existing) {
        git remote set-url origin $CloneUrl
        Write-Host "   Updated existing remote 'origin' to: $CloneUrl"
    } else {
        git remote add origin $CloneUrl
        Write-Host "   Added remote 'origin': $CloneUrl"
    }

    Write-Host ""
    Write-Host "🚀 Ready to push! Run:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main"

} catch {
    Write-Host "❌ Failed to create repository: $_" -ForegroundColor Red
    Write-Host "   Make sure your PAT has the 'repo' scope."
}
