@echo off
setlocal
cd /d "%~dp0"
if exist api\data (
  echo Removendo api\data antiga para a Vercel nao contar os helpers como funcoes...
  rmdir /s /q api\data
)
echo.
echo Correcao V15.1 aplicada.
echo Agora execute:
echo   git add -A
echo   git commit -m "Game Guess V15.1 Vercel Function Fix"
echo   git push origin main
pause
