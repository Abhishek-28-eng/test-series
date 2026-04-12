# TestSeries Pro - MHT-CET, JEE, NEET Platform

A comprehensive full-stack Online Test Series Platform built for coaching institutes with a config-driven exam engine.

## Tech Stack
* **Backend:** Node.js, Express.js, Sequelize ORM, MySQL
* **Frontend:** React (Vite), React Router, Context API, Vanilla CSS

## Setup Instructions

### 1. Database Setup
1. Ensure you have **MySQL** installed and running on your system.
2. Open your MySQL client and create a new database:
   ```sql
   CREATE DATABASE test_series_db;
   ```
3. Open `backend/.env` and update your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=test_series_db
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the seeder to initialize Exam Configurations and the default Admin user:
   ```bash
   npm run seed
   ```
   *(This will create the tables, insert all exam rules, and create the default admin account).*
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite React app:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

---

## Default Credentials
After running the seeder, use this account to access the Admin Panel:
* **Email:** `admin@testseries.com`
* **Password:** `Admin@123`

Student accounts can be created from the Registration page on the frontend.

## Flow Guide
1. **Admin:** Login -> Manage Tests -> Create Test -> Select Config (JEE/NEET/etc).
2. **Admin:** Go to "Questions" and upload the provided `sample_questions.csv`.
3. **Admin:** Publish the Test.
4. **Student:** Login/Register -> Dashboard -> Start the published test.
