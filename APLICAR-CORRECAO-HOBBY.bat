@echo off
setlocal
if not exist "api" (
  echo [ERRO] Execute este .bat na raiz do projeto, onde existe a pasta api.
  pause
  exit /b 1
)
copy /Y "%~dp0geoguess.js" ".\geoguess.js" >nul
copy /Y "%~dp0index.html" ".\index.html" >nul
copy /Y "%~dp0api\asset.js" ".\api\asset.js" >nul
if exist ".\api\mapillary-asset.js" del /F /Q ".\api\mapillary-asset.js"
echo.
echo Correcao v20.4.1 aplicada.
echo O arquivo api\mapillary-asset.js foi removido se existia.
echo Agora faca commit e push para o GitHub.
echo.
pause
