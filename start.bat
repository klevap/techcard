@echo off
title Маршрутная Карта - Локальный Сервер
echo Запуск локального сервера...
echo.

python server.py

if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось запустить Python.
    echo Убедитесь, что Python установлен и добавлен в PATH.
    echo.
    pause
)