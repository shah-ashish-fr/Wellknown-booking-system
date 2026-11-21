@echo off
set PG_BIN=C:\Program Files\PostgreSQL\18\bin
set PG_DATA=%~dp0..\.postgres-data

echo Starting local PostgreSQL on port 5433...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_DATA%\server.log" -o "-p 5433" start
