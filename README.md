\# Job Application Tracker



A full-stack MERN application to manage job applications, monitor their status, and track follow-up dates.



\## Tech Stack



\- \*\*Frontend:\*\* React, Vite, CSS

\- \*\*Backend:\*\* Node.js, Express.js

\- \*\*Database:\*\* MongoDB Atlas with Mongoose



\## Features



\- Add, view, edit, and delete job applications

\- Search applications by company and filter by status

\- Track application status and status history

\- Automatically generate application IDs

\- Calculate follow-up dates and highlight overdue applications

\- Prevent duplicate active applications

\- Validate allowed status transitions



\## Project Structure



\- `frontend/` — React user interface

\- `backend/` — Express API and MongoDB models



\## Setup



\### Backend



1\. Open a terminal in `backend/`.

2\. Run `npm install`.

3\. Configure `MONGODB\_URI` in your local environment file.

4\. Run `npm run dev`.



\### Frontend



1\. Open another terminal in `frontend/`.

2\. Run `npm install`.

3\. Run `npm run dev`.



\## API Endpoints



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/applications` | List applications, filters, and status counts |

| POST | `/api/applications` | Create an application |

| GET | `/api/applications/:id` | View application details and history |

| PUT | `/api/applications/:id` | Edit an application |

| PATCH | `/api/applications/:id/status` | Change application status |

| DELETE | `/api/applications/:id` | Delete an application |



\## Screenshots



Add two screenshots of the running application here before submission.



\## Environment Variables



Configure `MONGODB\_URI` and `PORT` locally. Never publish real database credentials.



\## Author



Job Application Tracker — Full Stack Development Assessment



