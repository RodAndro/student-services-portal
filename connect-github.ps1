$repoUrl = "https://github.com/RodAndro/student-services-portal.git"

Write-Host "Connecting this repository to GitHub..."

try {
    git remote remove origin 2>$null
}
catch {
    # Ignore if origin does not exist.
}

git remote add origin $repoUrl

git fetch origin --prune

$currentBranch = git branch --show-current

if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Write-Host "No branch selected. Please check your git state first."
    exit 1
}

Write-Host "Pushing branch: $currentBranch"
git push -u origin HEAD

Write-Host "Done. Repository connected to: $repoUrl"
