**Sweety -- Blood Glucose Tracker**
Sweety is a web application for keeping track of blood glucose readings
in one place. Users can create an account, sign in, record their
readings, and look back at their saved entries through the dashboard and
reports.

I built this project to practice full-stack development, including
connecting a React frontend to an Express API and storing application
data in PostgreSQL.
**What the app can do**
- Create an account and sign in.
- Add, edit, and delete glucose readings.
- Record a reading with its date, time slot, and glucose value.
- Track four daily sessions: morning fasting, after breakfast, after
  lunch, and after dinner.
- See which daily sessions have been completed.
- Review reading history and filter it by date.
- Navigate through history using pagination.
- View daily, month-to-date, and previous-month reports.
- See report summaries containing the number of readings, average,
  minimum, and maximum values.
- Use the dashboard on desktop and mobile screens.
**Technologies used**
**Frontend **- React - JavaScript - HTML and CSS - Axios - React Router

**Backend** - Node.js - Express - PostgreSQL - JWT authentication -
bcrypt for password hashing

**Testing** - Jest - Supertest
**Project structure**
The project is separated into a frontend and a backend. The frontend
contains the React pages, styling, and API service. The backend contains
the Express routes, controllers, authentication middleware, database
configuration, and tests.
sweety-blood-glucose-tracker/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── tests/
│   ├── server.js
│   └── package.json
└── README.md
Your actual folder names may differ depending on how the project is
organized.
Getting started
1. Get the project
Clone your repository and move into its folder:
git clone <your-repository-url>
cd sweety-blood-glucose-tracker
2. Set up the backend
Open a terminal in the backend folder:
cd backend
npm install
Create a .env file in the backend folder and add your PostgreSQL
connection details and JWT secret:
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_secret_key
Make sure PostgreSQL is running and the database and required tables
have been created.

Start the backend:
npm run dev
The API will be available at http://localhost:5000.
3. Set up the frontend
Open another terminal and go to the frontend folder:
cd frontend
npm install
npm run dev
Open the local address shown by Vite in your terminal. It is commonly
http://localhost:5173.
Main API routes
The API routes below are used for authentication, reading management,
and reports. Protected reading routes require the user to be logged in.
  Method                  Route                                          Purpose
  POST                    /api/auth/register                           Create an account

  POST                    /api/auth/login                              Sign in

  POST                    /api/readings                                Add a reading

  GET                     /api/readings                                Get readings

  PUT                     /api/readings/:id                            Update a reading

  DELETE                  /api/readings/:id                            Delete a reading

  GET                     /api/readings/daily-report?date=YYYY-MM-DD   Get a daily report

  GET                     /api/readings/mtd-report                     Get the month-to-date
report
GET                     /api/readings/previous-month-report          Get the previous
month's report
Running the tests
Backend tests are written with Jest and Supertest. From the backend
folder, run:
npm test
A note about the app
Sweety is intended for recording and reviewing readings entered by the
user. It is not a diagnostic tool and should not be used as a substitute
for advice from a qualified healthcare professional.
About this project
This project has been a hands-on way for me to work with React, REST
APIs, authentication, PostgreSQL, CRUD operations, report calculations,
and backend testing.
