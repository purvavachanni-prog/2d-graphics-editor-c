@echo off
echo Compiling 2D ASCII Graphics Editor...
gcc -Wall -Wextra -std=c99 main.c drawing.c editor.c -o graphics_editor.exe
if %ERRORLEVEL% EQU 0 (
    echo Compilation successful! Created graphics_editor.exe
) else (
    echo Compilation failed with error code %ERRORLEVEL%
)
pause