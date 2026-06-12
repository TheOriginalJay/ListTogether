@echo off
setlocal EnableDelayedExpansion
title Cinematic Website Pipeline — Installer

:: ============================================================
:: CINEMATIC WEBSITE PIPELINE — WINDOWS INSTALLER v2.0
:: Desktop App Edition
::
:: Double-click this file. Run as Administrator.
:: When it finishes, use START-PIPELINE.bat on your Desktop.
:: ============================================================

color 0A
echo.
echo  ██████╗██╗███╗   ██╗███████╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗
echo ██╔════╝██║████╗  ██║██╔════╝████╗ ████║██╔══██╗╚══██╔══╝██║██╔════╝
echo ██║     ██║██╔██╗ ██║█████╗  ██╔████╔██║███████║   ██║   ██║██║
echo ██║     ██║██║╚██╗██║██╔══╝  ██║╚██╔╝██║██╔══██║   ██║   ██║██║
echo ╚██████╗██║██║ ╚████║███████╗██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╗
echo  ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝
echo.
echo  CINEMATIC PIPELINE INSTALLER v2.0 — Desktop App Edition
echo  ================================================================
echo  Installs: Node.js, Python, Git, Claude Desktop App,
echo            Headroom, Playwright, GitHub CLI, Vercel CLI,
echo            Supabase CLI, Claude browser extension
echo  Authenticates: GitHub, Vercel, Supabase
echo  Creates: START-PIPELINE.bat on your Desktop
echo  ================================================================
echo.

:: ── PATHS ──────────────────────────────────────────────────
set "PIPELINE_DIR=%USERPROFILE%\cinematic-pipeline"
set "CLAUDE_DIR=%USERPROFILE%\.claude"
set "SKILLS_DIR=%USERPROFILE%\.claude\skills"
set "SCRIPT_DIR=%~dp0"
set "LOG_FILE=%USERPROFILE%\Desktop\pipeline-install-log.txt"

echo Cinematic Pipeline Install Log > "%LOG_FILE%"
echo Started: %DATE% %TIME% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

:: ── REQUIRE ADMIN ──────────────────────────────────────────
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  [!] Needs Administrator. Right-click and "Run as administrator"
    pause & exit /b 1
)
echo  [OK] Running as Administrator
echo [OK] Admin >> "%LOG_FILE%"

:: ── WINGET ─────────────────────────────────────────────────
echo.
echo  [1/9] Checking winget...
winget --version >nul 2>&1
if %errorLevel% neq 0 (
    echo  [!] winget not found. Opening Microsoft Store...
    start ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1
    echo.
    echo  Install "App Installer" from the Store window, then re-run this installer.
    pause & exit /b 1
)
echo  [OK] winget ready
echo [OK] winget >> "%LOG_FILE%"

:: ── NODE.JS ─────────────────────────────────────────────────
echo.
echo  [2/9] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo  [..] Installing Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if !errorLevel! neq 0 (call :WARN "Node.js install failed — install from nodejs.org then re-run") else (
        call :REFRESH_PATH
        echo  [OK] Node.js installed
        echo [OK] Node.js >> "%LOG_FILE%"
    )
) else (
    for /f "tokens=*" %%v in ('node --version 2^>nul') do echo  [OK] Node.js %%v
    echo [OK] Node.js already present >> "%LOG_FILE%"
)

:: ── PYTHON ──────────────────────────────────────────────────
echo.
echo  [3/9] Checking Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo  [..] Installing Python 3.12...
    winget install --id Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
    if !errorLevel! neq 0 (call :WARN "Python install failed — install from python.org then re-run") else (
        call :REFRESH_PATH
        echo  [OK] Python 3.12 installed
        echo [OK] Python >> "%LOG_FILE%"
    )
) else (
    for /f "tokens=*" %%v in ('python --version 2^>nul') do echo  [OK] %%v
    echo [OK] Python already present >> "%LOG_FILE%"
)
python -m pip install --upgrade pip --quiet 2>nul

:: ── GIT ─────────────────────────────────────────────────────
echo.
echo  [4/9] Checking Git...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo  [..] Installing Git...
    winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements
    if !errorLevel! neq 0 (call :WARN "Git install failed — install from git-scm.com then re-run") else (
        call :REFRESH_PATH
        echo  [OK] Git installed
        echo [OK] Git >> "%LOG_FILE%"
    )
) else (
    for /f "tokens=*" %%v in ('git --version 2^>nul') do echo  [OK] %%v
    echo [OK] Git already present >> "%LOG_FILE%"
)

:: ── CLAUDE DESKTOP APP ──────────────────────────────────────
echo.
echo  [5/9] Checking Claude Desktop App...
if exist "%LOCALAPPDATA%\AnthropicClaude\claude.exe" (
    echo  [OK] Claude Desktop App already installed
    echo [OK] Claude Desktop present >> "%LOG_FILE%"
) else (
    echo  [..] Trying winget install...
    winget install --id Anthropic.Claude --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    if !errorLevel! neq 0 (
        echo  [..] Opening download page — install manually...
        start https://claude.ai/download
        echo.
        echo  ┌─────────────────────────────────────────────────────┐
        echo  │  Install the Claude desktop app from the page that  │
        echo  │  just opened. Sign in with your Anthropic account.  │
        echo  │  Press any key when done.                           │
        echo  └─────────────────────────────────────────────────────┘
        pause >nul
    ) else (
        echo  [OK] Claude Desktop App installed
        echo [OK] Claude Desktop installed >> "%LOG_FILE%"
    )
)

:: ── HEADROOM ────────────────────────────────────────────────
echo.
echo  [6/9] Installing Headroom (token compression)...
echo  [..] Downloading ML models — this may take a few minutes...
pip install "headroom-ai[all]" --quiet
if %errorLevel% neq 0 (
    echo  [WARN] Retrying without extras...
    pip install headroom-ai --quiet
    echo [WARN] Headroom degraded install >> "%LOG_FILE%"
) else (
    echo  [OK] Headroom installed
    echo [OK] Headroom >> "%LOG_FILE%"
)

:: ── PLAYWRIGHT ──────────────────────────────────────────────
echo.
echo  [7/9] Installing Playwright (headless browser automation)...
npm install -g playwright --quiet
if %errorLevel% neq 0 (
    call :WARN "Playwright npm install failed"
) else (
    echo  [..] Downloading browser binaries — this takes a few minutes...
    npx playwright install --quiet
    if !errorLevel! neq 0 (
        call :WARN "Playwright browser binaries failed — run 'npx playwright install' manually"
    ) else (
        echo  [OK] Playwright + Chromium/Firefox/WebKit installed
        echo [OK] Playwright >> "%LOG_FILE%"
    )
)

:: ── GITHUB + VERCEL + SUPABASE CLI ──────────────────────────
echo.
echo  [8/9] Installing CLIs (GitHub, Vercel, Supabase)...

echo  [..] GitHub CLI...
gh --version >nul 2>&1
if %errorLevel% neq 0 (
    winget install --id GitHub.cli --silent --accept-package-agreements --accept-source-agreements
    if !errorLevel! neq 0 (call :WARN "GitHub CLI failed") else (
        call :REFRESH_PATH
        echo  [OK] GitHub CLI installed
        echo [OK] GitHub CLI >> "%LOG_FILE%"
    )
) else (echo  [OK] GitHub CLI already installed)

echo  [..] Vercel CLI...
npm install -g vercel --quiet
if %errorLevel% neq 0 (call :WARN "Vercel CLI failed") else (
    echo  [OK] Vercel CLI installed
    echo [OK] Vercel CLI >> "%LOG_FILE%"
)

echo  [..] Supabase CLI...
npm install -g supabase --quiet
if %errorLevel% neq 0 (call :WARN "Supabase CLI failed") else (
    echo  [OK] Supabase CLI installed
    echo [OK] Supabase CLI >> "%LOG_FILE%"
)

:: ── BROWSER EXTENSION ───────────────────────────────────────
echo.
echo  [9/9] Browser Extension Setup
echo  ================================================================
echo   The Claude browser extension lets Claude browse websites
echo   directly inside your desktop app sessions. It reads live pages,
echo   extracts content, and pulls brand data — no screenshots needed.
echo.
echo   Install it now:
echo   1. Chrome/Edge opens to the Web Store
echo   2. Click "Add to Chrome"
echo   3. Sign in with your Anthropic account
echo   4. Pin it to your toolbar
echo   5. Return here and press any key
echo  ================================================================
echo.
start https://chromewebstore.google.com/search/Claude%20Anthropic
echo  Press any key once the extension is installed and signed in...
pause >nul
echo  [OK] Browser extension confirmed
echo [OK] Browser extension >> "%LOG_FILE%"

:: ── COPY PIPELINE FILES ─────────────────────────────────────
echo.
echo  [+] Setting up pipeline folder at %PIPELINE_DIR%...
if not exist "%PIPELINE_DIR%" mkdir "%PIPELINE_DIR%"
if not exist "%PIPELINE_DIR%\pipeline" mkdir "%PIPELINE_DIR%\pipeline"
if not exist "%PIPELINE_DIR%\handoff" mkdir "%PIPELINE_DIR%\handoff"
if not exist "%PIPELINE_DIR%\handoff\references" mkdir "%PIPELINE_DIR%\handoff\references"
if not exist "%PIPELINE_DIR%\personas" mkdir "%PIPELINE_DIR%\personas"

for %%f in (CLAUDE.md PIPELINE-START.md HOW-IT-WORKS.md README.md) do (
    if exist "%SCRIPT_DIR%%%f" (
        copy /Y "%SCRIPT_DIR%%%f" "%PIPELINE_DIR%\%%f" >nul
        echo  [OK] %%f
    )
)
for %%f in (
    api-selection-guide.md
    client-portal-spec.md
    intake-template.md
    pass-1-prompt-template.md
    pass-2-prompt-template.md
    reference-scoring-checklist.md
    setup-guide.md
    supabase-schema-template.sql
) do (
    if exist "%SCRIPT_DIR%pipeline\%%f" (
        copy /Y "%SCRIPT_DIR%pipeline\%%f" "%PIPELINE_DIR%\pipeline\%%f" >nul
    )
)

:: Create a placeholder handoff readme
echo Claude writes intake-filled.md here during each session. > "%PIPELINE_DIR%\handoff\README.txt"
echo Reference images land in the references\ subfolder. >> "%PIPELINE_DIR%\handoff\README.txt"

echo  [OK] All pipeline files ready
echo [OK] Files copied >> "%LOG_FILE%"

:: ── CLAUDE SKILLS DIR ───────────────────────────────────────
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"
echo  [OK] Skills directory: %SKILLS_DIR%
echo [OK] Skills dir >> "%LOG_FILE%"

:: ── AUTH FLOWS ──────────────────────────────────────────────
echo.
echo  ================================================================
echo   AUTHENTICATION
echo   Browser windows open one at a time. Complete each login,
echo   return here, and press any key to continue to the next.
echo  ================================================================
echo.

echo  [AUTH 1/3] GitHub
gh auth status >nul 2>&1
if %errorLevel% equ 0 (
    echo  [OK] GitHub — already authenticated
    echo [OK] GitHub already authed >> "%LOG_FILE%"
) else (
    echo  Sign in to GitHub in the browser window that opens...
    gh auth login --web --git-protocol https
    if !errorLevel! neq 0 (call :WARN "GitHub auth failed — run 'gh auth login' manually") else (
        echo  [OK] GitHub authenticated
        echo [OK] GitHub >> "%LOG_FILE%"
    )
)

echo.
echo  [AUTH 2/3] Vercel
vercel whoami >nul 2>&1
if %errorLevel% equ 0 (
    echo  [OK] Vercel — already authenticated
    echo [OK] Vercel already authed >> "%LOG_FILE%"
) else (
    echo  Sign in to Vercel in the browser window that opens...
    vercel login
    if !errorLevel! neq 0 (call :WARN "Vercel auth failed — run 'vercel login' manually") else (
        echo  [OK] Vercel authenticated
        echo [OK] Vercel >> "%LOG_FILE%"
    )
)

echo.
echo  [AUTH 3/3] Supabase
supabase projects list >nul 2>&1
if %errorLevel% equ 0 (
    echo  [OK] Supabase — already authenticated
    echo [OK] Supabase already authed >> "%LOG_FILE%"
) else (
    echo  Sign in to Supabase in the browser window that opens...
    supabase login
    if !errorLevel! neq 0 (call :WARN "Supabase auth failed — run 'supabase login' manually") else (
        echo  [OK] Supabase authenticated
        echo [OK] Supabase >> "%LOG_FILE%"
    )
)

:: ── DESKTOP SHORTCUTS ───────────────────────────────────────
echo.
echo  [+] Creating Desktop shortcuts...

:: START-PIPELINE.bat — opens app + pipeline folder
set "START_BAT=%USERPROFILE%\Desktop\START-PIPELINE.bat"
(
echo @echo off
echo title Cinematic Pipeline
echo color 0A
echo echo.
echo echo  ==========================================
echo echo   CINEMATIC PIPELINE — STARTING SESSION
echo echo  ==========================================
echo echo.
echo echo  Opening Claude Desktop App...
echo start "" "%LOCALAPPDATA%\AnthropicClaude\claude.exe"
echo timeout /t 2 /nobreak >nul
echo echo  Opening pipeline folder...
echo explorer "%PIPELINE_DIR%"
echo echo.
echo echo  In the Claude app:
echo echo    Switch to Code mode
echo echo    Type: run PIPELINE-START.md — [client name] [URLs]
echo echo.
echo echo  Claude browses, researches, builds and deploys.
echo echo  You check in at Step 5 and confirm deploy at Step 9.
echo echo.
echo pause
) > "%START_BAT%"
echo  [OK] START-PIPELINE.bat on Desktop
echo [OK] START-PIPELINE.bat >> "%LOG_FILE%"

:: PIPELINE-REFERENCE.bat — quick cheat sheet
set "REF_BAT=%USERPROFILE%\Desktop\PIPELINE-REFERENCE.bat"
(
echo @echo off
echo title Pipeline Reference
echo color 0B
echo echo.
echo echo  ==========================================
echo echo   HOW TO START A BUILD
echo echo  ==========================================
echo echo.
echo echo  1. Double-click START-PIPELINE.bat
echo echo  2. In Claude desktop app, switch to Code mode
echo echo  3. Type: run PIPELINE-START.md — [client name] [URLs]
echo echo.
echo echo  Example:
echo echo    run PIPELINE-START.md — Mila's Wine Bar Melbourne
echo echo    site: milaswine.com.au, Instagram: @milaswine
echo echo.
echo echo  ==========================================
echo echo   YOUR TWO CHECKPOINTS
echo echo  ==========================================
echo echo.
echo echo  Step 5 — Review Pass 1 at localhost:3000
echo echo  Step 9 — Confirm deploy (Claude asks you first)
echo echo.
echo echo  ==========================================
echo echo   FILES
echo echo  ==========================================
echo echo.
echo echo  Pipeline:     %PIPELINE_DIR%\
echo echo  Intake form:  %PIPELINE_DIR%\pipeline\intake-template.md
echo echo  Handoff data: %PIPELINE_DIR%\handoff\
echo echo  References:   %PIPELINE_DIR%\handoff\references\
echo echo.
echo echo  ==========================================
echo echo   IF AUTH TOKENS EXPIRE
echo echo  ==========================================
echo echo.
echo echo    gh auth login        GitHub
echo echo    vercel login         Vercel
echo echo    supabase login       Supabase
echo echo.
echo echo  ==========================================
echo echo   FIRST SESSION ONLY
echo echo  ==========================================
echo echo.
echo echo  Inside Claude Code, run once:
echo echo    claude skill add safishamsi/graphify
echo echo    claude skill add blader/Claudeception
echo echo.
echo echo  Then run Soul Transplant to personalise Claude:
echo echo    run soul transplant
echo echo.
echo pause
) > "%REF_BAT%"
echo  [OK] PIPELINE-REFERENCE.bat on Desktop
echo [OK] PIPELINE-REFERENCE.bat >> "%LOG_FILE%"

:: ── FINAL VERIFICATION ──────────────────────────────────────
echo.
echo  ================================================================
echo   VERIFICATION
echo  ================================================================
echo.
call :CHECK "node --version"           "Node.js"
call :CHECK "python --version"         "Python"
call :CHECK "git --version"            "Git"
call :CHECK "headroom --version"       "Headroom"
call :CHECK "npx playwright --version" "Playwright"
call :CHECK "gh --version"             "GitHub CLI"
call :CHECK "vercel --version"         "Vercel CLI"
call :CHECK "supabase --version"       "Supabase CLI"
echo.
call :FILE_CHECK "%LOCALAPPDATA%\AnthropicClaude\claude.exe"  "Claude Desktop App"
call :FILE_CHECK "%PIPELINE_DIR%\CLAUDE.md"                   "CLAUDE.md"
call :FILE_CHECK "%PIPELINE_DIR%\PIPELINE-START.md"           "PIPELINE-START.md"
call :FILE_CHECK "%PIPELINE_DIR%\pipeline\intake-template.md" "intake-template.md"
call :FILE_CHECK "%PIPELINE_DIR%\handoff"                     "handoff\ folder"

:: ── DONE ────────────────────────────────────────────────────
echo.
echo  ================================================================
echo   SETUP COMPLETE
echo  ================================================================
echo.
echo  Everything is installed. Three things left to do:
echo.
echo  1. FIRST SESSION — install Claude Code skills (one time only):
echo       Open Claude desktop app in Code mode and type:
echo       claude skill add safishamsi/graphify
echo       claude skill add blader/Claudeception
echo.
echo  2. SOUL TRANSPLANT — personalise Claude (one time only):
echo       In any session type: run soul transplant
echo       Answer the interview questions. Claude remembers forever.
echo.
echo  3. START A BUILD:
echo       Double-click START-PIPELINE.bat on your Desktop
echo       Type: run PIPELINE-START.md — [client name] [URLs]
echo.
echo  Log saved to: %LOG_FILE%
echo.
echo  ================================================================
echo [DONE] %DATE% %TIME% >> "%LOG_FILE%"
pause
exit /b 0

:: ── HELPERS ─────────────────────────────────────────────────

:CHECK
%~1 >nul 2>&1
if %errorLevel% equ 0 (echo  [OK] %~2) else (echo  [!!] %~2 — NOT FOUND)
goto :eof

:FILE_CHECK
if exist "%~1" (echo  [OK] %~2) else (echo  [!!] %~2 — MISSING)
goto :eof

:WARN
echo.
echo  [WARN] %~1
echo  [WARN] Continuing — fix manually after setup completes.
echo.
echo [WARN] %~1 >> "%LOG_FILE%"
goto :eof

:REFRESH_PATH
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SYSPATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USERPATH=%%b"
set "PATH=%SYSPATH%;%USERPATH%"
goto :eof
