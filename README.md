💼 Job Listing & Freelance Matchmaking API – Backend
A secure job listing platform backend built with Node.js, Express.js, and PostgreSQL (Prisma ORM). This system connects clients who post projects with freelancers who can apply, while enabling clients to review, approve, reject, or mark applications as pending.

Built by Team Alpha during the Tenyne Full-Stack Developer Internship.

🌍 Live Deployment
Base API URL: https://team-alpha-profile-card-auth-api.onrender.com

GitHub Repository: Team-Alpha-profile-card-auth-api

Postman Collection: Download here

Demo Video: Coming soon

🧾 What This Platform Does
This platform is like a freelance job board. Here's how it works:

Clients can:

Post jobs (projects)

View applications submitted by freelancers

Approve, reject, or set applications as pending

Archive and unarchive projects

Freelancers can:

Register and build a profile

Upload resumes, documents, and badges

Search and apply to projects

Manage their application history

🧱 Tech Stack
Layer	Tool / Framework
Server	Node.js, Express.js
Database	PostgreSQL with Prisma ORM
Auth	JWT, bcrypt
File Upload	Multer
Email	Nodemailer (SMTP)
Testing	Jest, Supertest
Deployment	Render.com

📁 Project Structure
pgsql
Copy
Edit
server/
├── controllers/
├── middleware/
├── models/
├── routes/
├── uploads/
├── utils/
├── prisma/
├── server.js
└── .env.example
🔧 Setup (Local)
Clone the repo:

bash
Copy
Edit
git clone https://github.com/Tenyne-Internship-Projects/Team-Alpha-profile-card-auth-api.git
cd Team-Alpha-profile-card-auth-api
Install dependencies:

bash
Copy
Edit
npm install
Create a .env file:

bash
Copy
Edit
cp .env.example .env
Run database migration and generate Prisma client:

bash
Copy
Edit
npx prisma migrate dev --name init
npx prisma generate
Start development server:

bash
Copy
Edit
npm run dev
🔐 Auth & Account Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register as client or freelancer
POST	/api/auth/login	Login and receive JWT
GET	/api/auth/verify-email	Email verification with token
POST	/api/auth/resend-email	Resend verification link
POST	/api/auth/forgot-password	Request a password reset
POST	/api/auth/reset-password	Reset password with token

👤 Profile Management
Method	Endpoint	Description
GET	/api/profile	Get logged-in user's profile
PUT	/api/profile/:userId	Update profile, avatar, and documents
PATCH	/api/profile/:userId/availability	Set availability status
POST	/api/profile/:userId/badges	Upload skill badges
GET	/api/profile/:userId/badges	View uploaded badges
DELETE	/api/profile/:userId	Soft-delete user account

📢 Projects – Client Side
Method	Endpoint	Description
POST	/api/project/create/:clientId	Create a new project
GET	/api/project	Get all projects (active)
GET	/api/project/:projectId	View one project
PUT	/api/project/:projectId	Update a project
DELETE	/api/project/:projectId	Delete a project
PUT	/api/project/archive/:projectId	Archive a project
GET	/api/project/archive	View archived projects
PUT	/api/project/archive/unarchive/:projectId	Unarchive a project

💬 Applications – Freelancer to Client
Method	Endpoint	Who Can Use	Description
POST	/api/applications/apply/:projectId	Freelancer	Apply to a client’s project
GET	/api/applications/my-applications	Freelancer	View your own applications
GET	/api/applications	Client	View all applications to your projects
GET	/api/applications/:applicationId	Client	View a specific application
PUT	/api/applications/:applicationId	Client	Update status: approved, rejected, pending

✅ Application Status Flow
Status	Description
pending	Application submitted, but not reviewed yet
approved	Client approved the freelancer's application
rejected	Client rejected the freelancer's application

🔍 Sample Request – Apply for a Job
POST /api/applications/apply/:projectId

json
Copy
Edit
{
  "message": "I'm excited to work on this project because of my experience with similar tasks."
}
Headers:

Authorization: Bearer <JWT>

🧪 Testing
Run unit and integration tests:

bash
Copy
Edit
npm test
Tests cover:

Auth flows

Profile updates

Application logic

Edge cases and invalid input

🔐 Security Measures
Passwords hashed with bcrypt

Email token expiration + rate-limiting

Secure JWT storage & validation

File validation and size checks

Input validation using Zod or Joi

📦 Future Improvements
Feature	Status
Full test coverage	✅ Done
Real-time notifications	🔜 Planned
Chat between users	🔜 Planned
Payment integration	🔜 Planned

🤝 Built by Team Alpha
Tenyne Full-Stack Developer Internship

Project Manager: Arinola Akindele

Backend Engineers: Light Ikoyo, Elijah Peter, Ja’Afar Sallau

Frontend Developer: Christfavour Oloba

UI/UX Designers: Emmanuel Olowo, Clinton Unaegbu

QA Tester: Olivia Edeh

📬 Support & Contact
Email: support@tenyne.com

Discord: #team-alpha channel in the Tenyne workspace

🙌 Thank You
Thanks for checking out the Job Listing & Freelance Matchmaking API! This project demonstrates real-world use of secure authentication, user profile management, job workflows, and application review – all designed to scale and integrate smoothly with frontend platforms.

