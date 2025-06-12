# Profile Card & Auth API – Backend

A secure, scalable, and modular authentication API built with Node.js, PostgreSQL, and Express.js to support a dynamic freelancer profile card platform.

Developed by **Team Alpha** at **Tenyne Innovations** as part of the Full-Stack Developer Internship.

##Live Deployment

- **API Base URL:** [https://team-alpha-profile-card-auth-api.onrender.com](https://team-alpha-profile-card-auth-api.onrender.com)
- **GitHub Repo:** [Team-Alpha-profile-card-auth-api](https://github.com/Tenyne-Internship-Projects/Team-Alpha-profile-card-auth-api)
- **Demo Video:** [Loom walkthrough – Coming Soon]
- **Postman Collection:** [Download Postman Collection](https://raw.githubusercontent.com/Tenyne-Internship-Projects/Team-Alpha-profile-card-auth-api/main/postman_collection.json)

##Project Overview

This backend powers a full-stack freelancer platform enabling:

- **Authentication:** Register, verify, login, password reset
- **Profile Management:** Create, edit, upload avatar/documents, availability toggle, badge upload
- **Database:** PostgreSQL with Prisma ORM
- **Email Integration:** SMTP for verification & password reset
- **Testing:** Comprehensive suite using Jest + Supertest

##Features

| Feature                       | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| **User Registration & Login** | Secure signup/login with password hashing (bcrypt) and JWT issuance   |
| **Email Verification**        | Secure email verification link with expiry and resend functionality   |
| **Password Reset**            | Token-based flow to securely reset forgotten passwords                |
| **Profile Management**        | Full CRUD on profile info, avatar and document uploads (via `multer`) |
| **Availability Toggle**       | Freelancers can set availability as "Open for Work"                   |
| **Badge Upload**              | Upload icons for tech stacks and certificates                         |
| **Testing Support**           | Full unit & integration tests with mocking via Jest + Supertest       |
| **PostgreSQL Integration**    | Using Prisma ORM with UUIDs and clean relational schema               |

##Tech Stack

| Layer                | Stack / Tool                |
| -------------------- | --------------------------- |
| **Backend**          | Node.js, Express.js         |
| **Authentication**   | JWT, bcrypt                 |
| **Database**         | PostgreSQL (via Prisma ORM) |
| **File Uploads**     | Multer (local file storage) |
| **Email**            | Nodemailer (SMTP)           |
| **Testing**          | Jest, Supertest             |
| **Environment Mgmt** | dotenv                      |
| **Deployment**       | Render.com                  |

##Project Structure

server/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── config/
├── uploads/
├── prisma/
├── tests/
├── server.js
├── .env.example
└── package.json

##Setup Instructions

###Prerequisites

- Node.js (v16+)
- PostgreSQL instance (local or cloud)
- SMTP credentials (Amazon SES, Gmail, SendGrid, etc.)

###Local Installation

1. **Clone the repo**

git clone https://github.com/Tenyne-Internship-Projects/Team-Alpha-profile-card-auth-api.git
cd Team-Alpha-profile-card-auth-api

2. **Install dependencies**

npm install

3. **Set up environment variables**

`.env.example` to `.env`, then fill in your SMTP, PostgreSQL, and JWT secrets.

4. **Apply migrations & generate Prisma client**

npx prisma migrate dev --name init
npx prisma generate

5. **Start the server**

npm run dev

The server will run at: [http://localhost:5000](http://localhost:5000)

##API Endpoints

###Auth Routes

| Method | Endpoint                    | Description                    | Auth? |
| ------ | --------------------------- | ------------------------------ | ----- |
| POST   | `/api/auth/register`        | Register new user              | ✔️    |
| POST   | `/api/auth/login`           | Login and receive JWT          | ✔️    |
| GET    | `/api/auth/verify-email`    | Verify email with secure token | ✔️    |
| POST   | `/api/auth/resend-email`    | Resend verification link       | ✔️    |
| POST   | `/api/auth/forgot-password` | Send password reset email      | ✔️    |
| POST   | `/api/auth/reset-password`  | Reset password using token     | ✔️    |

####Sample Request: Register User

**POST** `/api/auth/register`

```json
{
  "fullname": "Lius Rufus",
  "email": "liusrufus@gmail.com",
  "password": "yourSecurePassword123"
}
```

**Response**

```json
{
  "message": "User registered successfully. Please verify your email."
}
```

####Login Response

````json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "fullname": "Lius Rufus",
    "email": "liusrufus@gmail.com"
  }
}


###Profile Routes

| Method | Endpoint                            | Description                      | Auth? |
| ------ | ----------------------------------- | -------------------------------- | ----- |
| GET    | `/api/profile`                      | Get authenticated user's profile | ✔️    |
| PUT    | `/api/profile/:userId`              | Update user profile + uploads    | ✔️    |
| PATCH  | `/api/profile/:userId/availability` | Toggle availability status       | ✔️    |
| POST   | `/api/profile/:userId/badges`       | Upload badge                     | ✔️    |
| GET    | `/api/profile/:userId/badges`       | Get user's badges                | ✔️    |
| DELETE | `/api/profile/:userId`              | Soft-delete user account         | ✔️    |

####Example: Update Profile

**PUT** `/api/profile/0cf72366-...`
Headers:

* `Authorization: Bearer <jwt_token>`
* `Content-Type: multipart/form-data`

**Body (multipart form data):**

```json
{
  "fullname": "Jane Doe",
  "gender": "female",
  "dateOfBirth": "1995-04-22",
  "location": "Lagos, Nigeria",
  "skills": ["JavaScript", "Postman", "Figma"]
}
````

Attach:

- `avatar` file
- One or more `documents` (PDF)

**Expected Response (200 OK):**

```json
{
  "message": "User profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "jane@gmail.com",
    "profile": {
      "fullName": "Jane Doe",
      "gender": "female",
      "age": 29,
      "dateOfBirth": "1995-04-22T00:00:00.000Z",
      "avatarUrl": "/uploads/badges/123456.jpg",
      "documents": ["/uploads/badges/resume.pdf"],
      "skills": ["JavaScript", "Postman", "Figma"],
      "isAvailable": true
    }
  }
}


##Testing Instructions

Run all unit and integration tests:

npm test

Tests include:

* Auth flows
* Profile routes
* Middleware
* Error handling

> External services like email and OAuth are mocked for deterministic testing.


##Security & Robustness Highlights

* Token expiry and renewal for email verification
* Rate limiting on login & registration endpoints
* Input sanitization and null-field handling
* Server-side validation using Zod, Yup, or Joi
* Utility functions like `safeField`, `safeArray`, and `calculateAge()`
* File upload validations using `multer`


##Screenshots / Demo Video

(Add actual screenshots here)

Watch the demo video on Loom: **Demo Video Link** (coming soon)


##Future Enhancements

Feature                          Status

 Email resend on token expiry   Completed
 Password reset flow            Completed
 Full test coverage             Completed
 Rate limiting on auth routes   Completed
 Profile deletion flow          Completed

##Team & Collaboration

Built by Team Alpha for the Tenyne Full-Stack Developer Internship.

* PM: Arinola Akindele
* Backend Developers: Light Ikoyo, Elijah Peter, Ja’Afar Sallau
* Frontend Developer: Christfavour Oloba
* UI/UX Designers: Emmanuel Olowo, Clinton Unaegbu
* QA Tester: Olivia Edeh

Workflow:

* Feature branches → Pull Requests → Code Reviews → Merge
* Task tracking via GitHub Project Boards + ClickUp
* Communication via Discord (`#team-alpha`) & Google Meet


##Support & Contact

* Email: [support@tenyne.com](mailto:support@tenyne.com)

* Discord: `#team-alpha` on the Tenyne workspace

##Thank You

Thank you for reviewing the **Profile Card & Auth API – Backend**.

This project showcases clean architecture, secure authentication, modular design, and a collaborative workflow, all built to scale with frontend integrations and future enhancements.

```
