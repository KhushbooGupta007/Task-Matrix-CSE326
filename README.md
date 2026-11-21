# TaskMatrix — Smart Task Prioritizer

A responsive task-management web application built with **HTML, CSS and vanilla JavaScript** for an Internet Programming project.

## Features

- Sign up, sign in and log out (browser-local demo authentication)
- Create, view, edit and delete tasks
- Task categories and High / Medium / Low priorities
- Due dates, status tracking and in-app due-date reminders
- Urgent / Important flags and a four-quadrant prioritization matrix
- Dashboard statistics and completion overview
- Search, filter and sort tasks
- Form validation and responsive layout
- Per-user task lists stored in browser localStorage

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Create an account and start adding tasks.

No build tools or external JavaScript libraries are required. An internet connection is only needed to load the optional Google Fonts; the app itself works without them.

## Deploy with GitHub Pages

1. Create a new public GitHub repository, for example `taskmatrix`.
2. Upload `index.html`, `styles.css`, `app.js` and `README.md` to the repository root.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. Your link will look like `https://YOUR-USERNAME.github.io/taskmatrix/`.

Test the deployed link in a private/incognito browser window before submitting.

## Important technical note about authentication

This is a front-end educational demonstration. Account records and tasks are stored in the browser's `localStorage`; passwords are not securely hashed and there is no server/database. It is suitable for demonstrating client-side JavaScript concepts, but **must not be used for real accounts or sensitive information**. A production system requires a backend, secure password hashing, server-side validation and database storage.

## Suggested viva preparation

Be ready to explain:
- Semantic HTML structure and form controls
- CSS Grid, Flexbox, media queries and responsive design
- DOM selection and event listeners
- Arrays and objects used to represent tasks
- CRUD operations (Create, Read, Update, Delete)
- `localStorage` and `sessionStorage`
- Filtering, sorting and searching arrays
- How urgency and importance determine the four matrix quadrants
- Input validation and why front-end-only authentication is not secure

## Before submission

- [ ] Replace the repository URL in your UMS submission with your actual GitHub URL.
- [ ] Deploy and test the live website.
- [ ] Add team name, course code and all registration numbers to the UMS submission document/template.
- [ ] Record the required team video, ensuring every member participates.
- [ ] Test the GitHub, deployment and video links.
