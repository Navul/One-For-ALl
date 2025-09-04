@echo off
echo 🚀 Starting One-For-All Development Environment...
echo.
echo 📦 Installing dependencies...
call npm run install-all
echo.
echo 🔧 Starting development servers...
echo ⚡ Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.
call npm run dev
