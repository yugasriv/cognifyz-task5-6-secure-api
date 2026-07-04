# Cognifyz Internship — Task 5 & Task 6

**Task 5: API Integration and Front-End Interaction**
- RESTful CRUD API (`/api/items`) built with Express
- Front-end (`public/index.html`) fetches and displays data from the API

**Task 6: Database Integration and User Authentication**
- Real SQLite database (Node's built-in `node:sqlite`) storing users + items
- User authentication via JWT (register/login), passwords hashed with bcrypt
- All CRUD endpoints protected with an auth middleware — no token, no access

## How to run (2 minutes)

1. Make sure you have **Node.js v22+** installed (`node -v`).
2. In this folder, run:
   ```
   npm install
   node server.js
   ```
3. Open your browser to **http://localhost:3000**
4. Register a new account, log in, and start adding/editing/deleting items.

## API Endpoints
| Method | Endpoint              | Auth required | Description        |
|--------|------------------------|:--------------:|---------------------|
| POST   | /api/auth/register     | No             | Create account       |
| POST   | /api/auth/login        | No             | Log in, get JWT      |
| GET    | /api/items             | Yes            | List your items      |
| GET    | /api/items/:id         | Yes            | Get one item         |
| POST   | /api/items             | Yes            | Create item          |
| PUT    | /api/items/:id         | Yes            | Update item          |
| DELETE | /api/items/:id         | Yes            | Delete item          |

Auth uses `Authorization: Bearer <token>` header (frontend handles this automatically after login).

## What to say in your submission / demo
- "I built a RESTful API with full CRUD operations, integrated a SQLite database, and implemented JWT-based user authentication so each user only sees their own data. All endpoints are protected — unauthenticated requests are rejected with a 401."
