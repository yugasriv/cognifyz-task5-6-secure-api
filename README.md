# 🔐 Secure CRUD API — Cognifyz Internship (Task 5 & 6)

![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-black?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-database-003B57?logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)
![Status](https://img.shields.io/badge/status-complete-brightgreen)

A full-stack RESTful API with real database integration and JWT-based user authentication — built as part of the **Cognifyz Technologies** internship.

## 📌 What this covers

**Task 5 — API Integration & Front-End Interaction**
- RESTful CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`)
- A front-end that fetches, displays, creates, and updates data live from the API

**Task 6 — Database Integration & User Authentication**
- Real SQLite database (Node's built-in `node:sqlite`) for users and items
- User registration & login with bcrypt-hashed passwords
- JWT-based authentication — every CRUD endpoint requires a valid token
- Users can only see and manage their own data

## 🛠 Tech Stack
- **Backend:** Node.js, Express
- **Database:** SQLite (via `node:sqlite`)
- **Auth:** JWT + bcrypt
- **Frontend:** Vanilla JS, HTML, CSS

## 🚀 Run it locally

```bash
git clone https://github.com/yugasriv/cognifyz-task5-6-secure-api.git
cd cognifyz-task5-6-secure-api
npm install
node server.js
```
Then open **http://localhost:3000**

## 📡 API Endpoints

| Method | Endpoint            | Auth | Description      |
|--------|----------------------|:----:|-------------------|
| POST   | /api/auth/register   | ❌   | Create account    |
| POST   | /api/auth/login      | ❌   | Log in, get JWT   |
| GET    | /api/items           | ✅   | List your items   |
| GET    | /api/items/:id       | ✅   | Get one item      |
| POST   | /api/items           | ✅   | Create item       |
| PUT    | /api/items/:id       | ✅   | Update item       |
| DELETE | /api/items/:id       | ✅   | Delete item       |

## 👩‍💻 Author
**Yuga Sri** — B.Tech AI & Data Science, Er. Perumal Manimekalai College of Engineering
