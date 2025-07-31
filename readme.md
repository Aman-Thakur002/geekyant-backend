# ⚙️ Engineering Resource Management System

A full-featured backend system built with **Node.js**, **Express**, and **MongoDB** to manage engineering resources, track assignments, manage projects, and provide dashboards for engineers and managers.

---

## 🚀 Features

### 👥 Authentication
* Secure login for **Managers** and **Engineers**
* JWT-based session handling
* Role-based access control

### 🧑‍💻 Engineers
* Add, update, delete engineers
* View engineers by filters (skills, seniority, etc.)
* View individual engineer's capacity
* Assign engineers to projects with availability checks

### 📁 Projects
* Create, update, and manage projects
* Assign engineers based on required skills
* View project details and list
* Fetch suitable engineers automatically for a project

### 📌 Assignments
* Assign engineers to projects with percentage allocation
* Update or delete assignments
* Filter assignments by engineer/project/status

### 📊 Dashboards
* **Manager Dashboard**: Overview of teams and resources
* **Engineer Dashboard**: Current and past assignments
* **Analytics Dashboard**: Insights on capacity and utilization

### 👤 User Management (Legacy)
* View and update user profiles
* Change password functionality

---

## 🛠️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd geekyants-task
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables
Create a `.env` file in the root directory with the following:

```env
PORT=4100
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

### 4️⃣ Seed the database

```bash
npm run seed:engineering
```

### 5️⃣ Run the server

```bash
npm run dev
```

By default, the server will start at: 📡 `http://localhost:4100/api`

---

## 🧪 API Documentation

Import the provided **Postman Collection** to test all endpoints.

### Collection Includes:
* **Authentication**
* **Engineers**
* **Projects**
* **Assignments**
* **Dashboards**
* **Users (Legacy)**

### Test Credentials:

**Manager**
```json
{
  "email": "manager@company.com",
  "password": "manager123"
}
```

**Engineer**
```json
{
  "email": "alice@company.com",
  "password": "engineer123"
}
```

Set the `{{baseUrl}}` variable in Postman to:
```text
http://localhost:4100/api
```

---

## 📁 Folder Structure (Typical)

```
geekyants-task/
│
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── config/
├── .env
├── package.json
└── server.js / index.js
```

---

## 🧰 Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB + Mongoose**
* **JWT** (Authentication)
* **Postman** (API Testing)

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the server in production mode |
| `npm run dev` | Runs the server in development mode with auto-reload |
| `npm run seed:engineering` | Seeds the database with sample data |
| `npm test` | Runs the test suite |

---

## 🔐 Authentication & Authorization

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Role-based Access:
- **Managers**: Full access to all resources
- **Engineers**: Limited access, can view own assignments and update own profile

---

## 📊 API Endpoints

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
```

### Engineers
```http
GET    /api/engineers
POST   /api/engineers
GET    /api/engineers/:id
PUT    /api/engineers/:id
DELETE /api/engineers/:id
```

### Projects
```http
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/suitable-engineers
```

### Assignments
```http
GET    /api/assignments
POST   /api/assignments
GET    /api/assignments/:id
PUT    /api/assignments/:id
DELETE /api/assignments/:id
```

### Dashboard
```http
GET /api/dashboard/manager
GET /api/dashboard/engineer
GET /api/dashboard/analytics
```

---

## 🌟 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4100` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/engineering_resources` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_super_secret_key_here` |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 📌 Future Improvements (Optional)

* Swagger for live API docs
* CI/CD with Docker
* Email notifications for assignments
* Frontend dashboard (React)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🧑‍💻 Author

**Engineering Resource Management System** - Backend by [Your Name]  
Challenge by GeekyAnts

--