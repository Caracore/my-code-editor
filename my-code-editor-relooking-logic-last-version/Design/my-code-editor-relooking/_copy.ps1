$dirs = @('context','hooks','lsp','managers','themes','utils','types','state','extensions','cursor')
$comps = @('Editor','Terminal','SearchBar','WelcomeScreen','ErrorBoundary','SettingsPanel','ThemeManager','TodoList','TopMenu')

function Copy-NoOverwrite($srcRoot, $dstRoot) {
  if (-not (Test-Path -LiteralPath $srcRoot)) { Write-Host "MISSING: $srcRoot"; return }
  if (-not (Test-Path -LiteralPath $dstRoot)) { New-Item -ItemType Directory -Path $dstRoot -Force | Out-Null }
  $base = (Resolve-Path -LiteralPath $srcRoot).Path
  Get-ChildItem -LiteralPath $srcRoot -Recurse -Force | ForEach-Object {
    $rel = $_.FullName.Substring($base.Length).TrimStart('\','/')
    $target = Join-Path $dstRoot $rel
    if ($_.PSIsContainer) {
      if (-not (Test-Path -LiteralPath $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
    } else {
      if (Test-Path -LiteralPath $target) { Write-Host "SKIP: $target" }
      else {
        $td = Split-Path $target -Parent
        if (-not (Test-Path -LiteralPath $td)) { New-Item -ItemType Directory -Path $td -Force | Out-Null }
        Copy-Item -LiteralPath $_.FullName -Destination $target
        Write-Host "COPY: $target"
      }
    }
  }
}

foreach ($d in $dirs) { Copy-NoOverwrite "src copy/$d" "src/$d" }
foreach ($c in $comps) { Copy-NoOverwrite "src copy/components/$c" "src/components/$c" }
