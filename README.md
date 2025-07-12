💼 Team Alpha Freelance Job Board API
A robust backend system that powers a freelance job listing and matchmaking platform, connecting clients and freelancers. Built using Node.js, Express, PostgreSQL (via Prisma ORM), and Cloudinary for file storage.

🔨 Developed by Team Alpha during the Tenyne Full-Stack Developer Internship

🌍 Live Resources
API Base URL: https://team-alpha-profile-card-auth-api-pt9r.onrender.com/

Swagger Docs: https://team-alpha-profile-card-auth-api-pt9r.onrender.com/api-docs

GitHub Repo: Team-Alpha-profile-card-auth-api

Postman Collection: Coming soon

Demo Video: Coming soon

🧾 Platform Overview
This backend supports a freelance job marketplace where:

Clients can:
Post and manage projects

View, approve, reject, or mark applications as pending

Archive or unarchive previous projects

Freelancers can:
Register and manage their profiles

Upload resumes, badges, and avatars

Search and apply to projects

View application history

Save favorite jobs

🧱 Tech Stack
Layer Technology
Backend Server Node.js, Express.js
Database PostgreSQL with Prisma ORM
Authentication JWT, bcrypt
File Uploads Multer
Media Storage Cloudinary
Email Services Nodemailer (SMTP)
Validation Zod / Joi
Testing Jest, Supertest
Deployment Render.com

📁 Folder Structure
bash
Copy
Edit
server/
├── **mocks**/ # Test mocks
├── config/ # DB, SMTP, Cloudinary configs
├── controllers/ # Request handlers
├── middleware/ # Auth, error, validation
├── routes/ # API route definitions
├── uploads/ # Temporary file storage
├── utils/ # Helpers and utilities
├── test/ # Unit and integration tests
├── prisma/ # Prisma schema and migrations
├── server.js # Entry point
└── .env.example # Sample environment variables
🔐 Security Features
Passwords hashed with bcrypt

JWT-based authentication with role access control

Email verification and password reset tokens with expiration

Secure file uploads with Multer and Cloudinary

Input validation using Zod or Joi

File size/type restrictions for uploads

Basic rate limiting and request sanitation

🔧 Local Development Setup
bash
Copy
Edit
git clone https://github.com/Tenyne-Internship-Projects/Team-Alpha-profile-card-auth-api.git
cd Team-Alpha-profile-card-auth-api

npm install
cp .env.example .env

npx prisma migrate dev --name init
npx prisma generate

npm run dev
🔗 API Endpoints Reference
All endpoints are prefixed with /api/

🔐 Authentication & Account
Method Endpoint Description
POST /auth/register Register a new user (client or freelancer)
POST /auth/login Login and receive token
POST /auth/logout Logout user
POST /auth/verify-email/{token} Verify email
POST /auth/resend-verification Resend verification email
POST /auth/request-password-reset Request password reset link
POST /auth/reset-password/{token} Reset password with token
POST /auth/refresh-token Refresh access token
GET /auth/test Test auth route

👤 Freelancer Profile
Method Endpoint Description
PUT /profile/freelancer/{userId} Update freelancer profile
GET /profile/freelancer/{userId} Get freelancer profile by ID
DELETE /profile/freelancer/{userId} Delete freelancer (admin only)
POST /profile/freelancer-uploads/{userId} Upload avatar/documents to Cloudinary
PUT /profile/freelancer-availability/{userId} Toggle availability status
PUT /profile/freelancer-badge/{userId} Upload badge
GET /profile/freelancer-badge/{userId} Get freelancer badges
GET /profile/freelancer/test Test freelancer route
GET /profile/freelancers Get all freelancers (admin only)

🧑‍💼 Client Profile
Method Endpoint Description
PUT /profile/client/{userId} Create or update client profile
GET /profile/client/{userId} Get client profile by ID
DELETE /profile/client/{userId} Delete client (admin only)
GET /profile/client/test Test client route
GET /profile/clients Get all clients (admin only)

📢 Project Management
Method Endpoint Description
POST /project/create/{clientId} Create a new project
GET /project Get all projects
GET /project/my-projects Get projects by logged-in client
GET /project/{id} Get specific project
PUT /project/{id} Update a project
DELETE /project/{id} Delete a project
PUT /project/archive/{id} Archive a project
PUT /project/archive/unarchive/{id} Unarchive a project
GET /project/archive View active and archived projects

💬 Applications
For Freelancers
Method Endpoint Description
POST /applications/apply/{projectId} Apply to a project
GET /applications/my-applications View freelancer's applications

For Clients
Method Endpoint Description
GET /applications View all applications to client projects
GET /applications/{projectId} View applicants for a project
GET /applications/{applicationId} View a specific application
PUT /applications/{applicationId} Update application status

❤️ Favorites (Freelancers)
Method Endpoint Description
POST /project/favorite/{projectId} Add a project to favorites
DELETE /project/favorite/{projectId} Remove project from favorites
GET /project/favorite View all saved projects

✅ Application Status Lifecycle
Status Description
pending Awaiting client review
approved Application accepted
rejected Application declined

🧪 Testing
Run full test suite:

bash
Copy
Edit
npm test
Covers:

Authentication and access control

User and profile updates

Application lifecycle

Error handling and edge cases

👥 Team Credits
Project Manager

Arinola Akindele

Backend Developers

Elijah Peter

Kayode

Frontend Developers

Christfavour Oloba

Busayo

UI/UX Designers

Ayo

Clinton Unaegbu

QA Tester

Olivia Edeh
