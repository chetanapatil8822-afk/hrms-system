# HRMS (Human Resource Management System)

A full-stack web application for managing human resources with a React frontend and Node.js Express backend using MongoDB.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **MongoDB** - Either local or MongoDB Atlas cloud account

## 🔽 Installation Instructions

### 1. Clone the Repository

**For Windows:**

```bash
git clone https://github.com/GautamGupta06/hrms.git
cd hrms
```

**For Mac:**

```bash
git clone https://github.com/GautamGupta06/hrms.git
cd hrms
```

The command is the same for both platforms!

### 2. Install Root Dependencies

From the project root directory, install dependencies:

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Configure Environment Variables

Create a `.env` file in the `backend` folder (one already exists, but verify it has your MongoDB connection):

**Backend Configuration** (`backend/.env`):

```
PORT=5000
JWT_SECRET=HRMS_SUPER_SECRET_KEY@_123

# For local MongoDB (Windows/Mac):
MONGO_URI=mongodb://127.0.0.1:27017/hrms

# OR for MongoDB Atlas cloud:
# MONGO_URI=mongodb+srv://username:password@cluster.xxxx.mongodb.net/hrms
```

⚠️ **Important**: Update `MONGO_URI` with your actual MongoDB connection string.

---

## 🚀 Running the Application

### Option 1: Run Both Backend & Frontend Simultaneously (Recommended)

From the project root directory:

**Windows:**

```bash
npm run dev
```

**Mac:**

```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 5173) concurrently.

### Option 2: Run Backend & Frontend Separately

**Terminal 1 - Backend:**

```bash
npm run backend
```

**Terminal 2 - Frontend:**

```bash
npm run frontend
```

---

## 📍 Access the Application

Once both servers are running:

- **Frontend**: Open your browser and go to `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🛠️ Project Structure

```
hrms/
├── backend/               # Node.js Express backend
│   ├── config/           # Configuration files
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── index.js          # Server entry point
│   ├── .env              # Environment variables
│   └── package.json
├── frontend/             # React Vite frontend
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

---

## 🗄️ Database Setup

### Using Local MongoDB (Windows & Mac)

1. **Install MongoDB Community Edition:**
   - [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [Mac](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-macos/)

2. **Start MongoDB:**
   - **Windows**: MongoDB usually starts as a service automatically
   - **Mac**: `brew services start mongodb-community`

3. **Verify connection** in backend console - you should see a MongoDB connection message

### Using MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Update the `MONGO_URI` in `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.xxxx.mongodb.net/hrms
   ```

---

## 🧪 Testing the API

A Postman collection is included in the backend folder:

- **File**: `backend/hrms-backend.postman_collection.json`
- Import this file into [Postman](https://www.postman.com/) to test all API endpoints

---

## 🔧 Available Scripts

### Root Directory

- `npm run dev` - Run both backend and frontend concurrently
- `npm run backend` - Run backend only
- `npm run frontend` - Run frontend only

### Backend

- `npm start` - Start backend server
- `npm run dev` - Start backend with nodemon (auto-reload)

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

---

## 📦 Technologies Used

### Backend

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **CORS** - Cross-Origin Resource Sharing

### Frontend

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **React Toastify** - Toast notifications

---

## 🐛 Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running
- Check `MONGO_URI` in `backend/.env`
- For local: `mongodb://127.0.0.1:27017/hrms`
- For Atlas: Verify username, password, and cluster name

### Port Already in Use

- Backend (5000): `lsof -i :5000` (Mac) or check Task Manager (Windows)
- Frontend (5173): `lsof -i :5173` (Mac) or netstat (Windows)

### npm install issues

- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Dependencies not updating

- Run `npm install --legacy-peer-deps` if facing peer dependency issues

---

## 📝 Environment Variables

The application uses environment variables for configuration:

| Variable     | Description               | Example                          |
| ------------ | ------------------------- | -------------------------------- |
| `PORT`       | Backend server port       | `5000`                           |
| `JWT_SECRET` | Secret key for JWT tokens | `HRMS_SUPER_SECRET_KEY@_123`     |
| `MONGO_URI`  | MongoDB connection string | `mongodb://127.0.0.1:27017/hrms` |

---

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

---

## 📄 License

This project is open source and available under the ISC License.

---

## 💬 Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review the backend `.env` configuration
3. Open an issue on GitHub

---

**Happy coding! 🚀**

