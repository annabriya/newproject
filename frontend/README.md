# CareerTrack – Job Application Tracker

CareerTrack is a full-stack web application that helps users manage and track their job applications in one place. Users can record application details, monitor application statuses, search and filter applications, and keep track of follow-ups.

## Live Demo

- **Frontend:** https://newproject-rust-kappa.vercel.app/
- **Backend API:** https://newproject-pzj3.onrender.com/api/applications
- **GitHub Repository:** https://github.com/annabriya/newproject

## Features

- Add new job applications with company and job role details.
- Track application status, including Applied, Interview, Offer, Rejected, Accepted, and Declined.
- View the total number of applications and status-wise counts.
- Search applications and filter them by status or company.
- Edit permitted application details.
- View application details and status history.
- Track follow-up dates and overdue follow-ups.
- Generate application IDs through the backend.
- Store application data in MongoDB.

## Technologies Used

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build tool | Vite |
| Backend | Node.js and Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Version control | Git and GitHub |

## Project Structure

```text
JobApplicationTracker/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── ...
├── backend/
│   ├── package.json
│   └── ...
└── README.md
```

*Note: This is a simplified structure. Additional files and folders may exist in your project.*

## Getting Started

### Prerequisites

Install the following before running the project locally:

- Node.js and npm
- Git
- A MongoDB Atlas database or another configured MongoDB database

### 1. Clone the repository

```bash
git clone https://github.com/annabriya/newproject.git
cd newproject
```

### 2. Run the backend

```bash
cd backend
npm install
```

Configure the required environment variables in a local `.env` file using the variable names expected by the backend code. Do not commit database passwords or other secrets.

Start the backend using the start script defined in `backend/package.json`, for example:

```bash
npm start
```

### 3. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## API Endpoints

The backend API uses the `/api/applications` route for job application management.

**Base URL:**

```text
https://newproject-pzj3.onrender.com/api/applications
```

The following are the main operations to document. Confirm each route and HTTP method against your backend code before submitting.

| Method | Purpose |
|---|---|
| GET | Retrieve job applications |
| POST | Create a job application |
| PUT/PATCH | Update permitted application details or status |
| DELETE | Delete an application when allowed |

The API returns structured responses containing fields such as `success`, `message`, and `data`.

## Application Status Workflow

The application supports these statuses:

- Applied
- Interview
- Offer
- Rejected
- Accepted
- Declined

Status transitions follow the workflow implemented by the backend. Rejected, Accepted, and Declined are terminal statuses.

## Database

MongoDB Atlas stores job application records. Mongoose is used by the backend to work with the database.

## Deployment

- **Frontend hosting:** Vercel
- **Backend hosting:** Render
- **Database hosting:** MongoDB Atlas

## Screenshots

Add screenshots of the working application here.

1. **Dashboard:** Shows the application list, total applications, and status counts.
2. **Application management:** Shows the form for adding or editing an application, or the application details view.

Save the screenshots in a folder such as `screenshots/` and embed them below after adding the image files:

```markdown
![CareerTrack Dashboard](screenshots/dashboard.png)

![Application Management](screenshots/application-management.png)
```

## Author

Developed as a Full Stack Development assessment project using the MERN stack.
