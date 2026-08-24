@echo off
setlocal
REM Execute este arquivo na raiz do projeto depois de copiar os arquivos do patch.
if exist geoguess.js del /q geoguess.js
if exist api\geoguess.js del /q api\geoguess.js
if exist api\geoguess-config.js del /q api\geoguess-config.js
if exist api\geoguess-map.js del /q api\geoguess-map.js
if exist GEOGUESS-MAPILLARY-SETUP.md del /q GEOGUESS-MAPILLARY-SETUP.md
echo GeoGuess removido. Patch V19.11.1 aplicado.
endlocal
