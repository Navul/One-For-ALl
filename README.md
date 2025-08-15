# OneForAll – Community Services Directory

## Overview
OneForAll is a web application that allows local service providers such as plumbers, electricians, and tutors to list their services. Users can browse these listings and book services directly through the platform.

## Project Structure
The project is divided into two main parts: the backend and the frontend.

```
oneforall-community-services-directory
├── backend
│   ├── controllers
│   │   └── serviceController.js
│   ├── models
│   │   └── service.js
│   ├── routes
│   │   └── serviceRoutes.js
│   ├── app.js
│   └── config
│       └── db.js
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── components
│   │   │   └── ServiceList.jsx
│   │   ├── pages
│   │   │   └── Home.jsx
│   │   ├── App.jsx
│   │   └── index.js
├── package.json
├── README.md
└── .gitignore
```

## Technologies Used
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your MongoDB connection in `backend/config/db.js`.
4. Start the server:
   ```
   node app.js
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## Usage
- Service providers can create an account and list their services.
- Users can browse available services and book them directly through the application.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.