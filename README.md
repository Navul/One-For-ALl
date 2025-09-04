# One-For-All Community Services Directory

A web application where local service providers can list services, and users can book them.

## 🚀 Quick Start

### Development (Localhost)

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Run in development mode**
   ```bash
   npm run dev
   ```
   This will start both backend (http://localhost:5000) and frontend (http://localhost:3000)

### Production (Render Deployment)

1. **Build for production**
   ```bash
   npm run build:prod
   ```

2. **Deploy to Render**
   - Push to GitHub
   - Render automatically builds and deploys

## 📁 Project Structure

```
├── backend/                 # Node.js/Express server
│   ├── .env                # Development environment variables
│   ├── .env.production     # Production environment variables
│   └── app.js              # Main server file
├── frontend/               # React application
│   ├── .env                # Development environment variables
│   ├── .env.production     # Production environment variables
│   └── src/                # React source code
└── package.json            # Root package.json with scripts
```

## 🔧 Environment Configuration

### Development (Localhost)
- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`
- Uses `backend/.env` and `frontend/.env`

### Production (Render)
- Single URL: `https://one-for-all-6lpg.onrender.com`
- Uses `backend/.env.production` and `frontend/.env.production`

## 📜 Available Scripts

### Root Level Scripts
- `npm run dev` - Start both backend and frontend in development mode
- `npm run server:dev` - Start only backend with nodemon (development)
- `npm run client:dev` - Start only frontend (development)
- `npm run build:dev` - Build frontend for development
- `npm run build:prod` - Build frontend for production
- `npm run install-all` - Install dependencies for all projects

### Backend Scripts (from /backend directory)
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start normally
- `npm run production` - Start in production mode

### Frontend Scripts (from /frontend directory)
- `npm run dev` - Start in development mode
- `npm start` - Start normally
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production

## 🌍 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
NODE_ENV=development
```

## 🔄 Switching Between Development and Production

The application automatically detects the environment based on `NODE_ENV`:

- **Development**: Uses localhost URLs, detailed logging
- **Production**: Uses Render URLs, optimized for deployment

## 🎯 Features

- **Real-time Chat System**: Socket.IO powered messaging
- **Notifications**: Bell icon notifications for chats and bookings
- **Google Maps Integration**: Location-based services
- **User Authentication**: JWT-based auth system
- **Role-based Access**: Admin, Provider, User roles
- **Instant Services**: Real-time service requests
- **Booking System**: Schedule and manage service bookings

## 📱 Usage

1. **For Development**: 
   - Clone the repository
   - Run `npm run install-all`
   - Run `npm run dev`
   - Open http://localhost:3000

2. **For Production**: 
   - Access https://one-for-all-6lpg.onrender.com
   - All features work the same as development

## 🐛 Troubleshooting

### Can't connect to localhost?
1. Make sure both servers are running: `npm run dev`
2. Check that ports 3000 and 5000 are available
3. Verify environment variables in `.env` files

### Chat notifications not working?
1. Check browser console for socket connection logs
2. Ensure both users are properly authenticated
3. Verify environment URLs match the running servers

### Build errors?
1. Run `npm run install-all` to ensure all dependencies are installed
2. Check that environment variables are properly set
3. Clear node_modules and reinstall if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test in development mode: `npm run dev`
4. Build for production: `npm run build:prod`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
