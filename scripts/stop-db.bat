@echo off
set PG_BIN=C:\Program Files\PostgreSQL\18\bin
set PG_DATA=%~dp0..\.postgres-data

echo Stopping local PostgreSQL on port 5433...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" stop
