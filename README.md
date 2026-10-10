# Project Tracker — Full-Stack Trello-Style App (Jira Clone)

A full-stack project management app inspired by Trello/Jira, built from scratch with
Node.js, Express, and MongoDB. Users create organizations, add boards, and track
work as issues that move across a Kanban board (Up Next → In Progress → Done).

## Features

- **Authentication** — signup and signin with JWT (JSON Web Tokens)
- **Organizations** — any signed-in user can create an organization and becomes its admin
- **Members** — admins can add and remove members from an organization
- **Boards** — organizations contain boards
- **Issues** — boards contain issues, each with a status (`up next`, `in progress`, `done`)
- **Kanban board** — a three-column frontend; issues move between columns, with the
  next status computed on the server
- **Role-based authorization** — only an organization's admin (or members, where
  allowed) can modify its data
- **Persistent storage** — all data is stored in MongoDB, so it survives server restarts

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | Node.js, Express                                  |
| Database  | MongoDB with Mongoose                             |
| Auth      | JSON Web Tokens (jsonwebtoken), custom middleware |
| Frontend  | HTML, CSS, JavaScript, axios                      |

## Project Structure

```
trello/
├── trello.js          # main server — all routes, starts on port 3008
├── middleware.js      # authMiddleware: verifies the JWT, sets req.userId
├── models.js          # Mongoose schemas and models (User, Organization, Board, Issue)
└── public/            # frontend, served via express.static
    ├── signup.html
    ├── signin.html
    ├── dashboard.html
    ├── onboarding.html
    ├── board.html
    ├── issues.html
    ├── members.html
    └── index.html
```

## Data Model

Records are linked by MongoDB ObjectId reference, forming a hierarchy:

```
User
Organization  { title, description, admin (User id), members [User ids] }
Board         { ... , organizationId }
Issue         { title, status, boardId }
```

To find which organization an issue belongs to, the server traverses
`issue.boardId -> board.organizationId -> organization`.

## Setup

1. Install dependencies:
   ```bash
   npm install express jsonwebtoken mongoose
   ```
2. Make sure MongoDB is running locally:
   ```bash
   brew services start mongodb-community
   ```
   The app connects to `mongodb://localhost:27017/Trello`.
3. Start the server:
   ```bash
   node trello.js
   ```
4. Open the app in your browser:
   ```
   http://localhost:3008/signup.html
   ```

## API Routes

### Public
| Method | Route      | Body                     | Description           |
|--------|------------|--------------------------|-----------------------|
| POST   | `/signup`  | `{ username, password }` | Create a new user     |
| POST   | `/signin`  | `{ username, password }` | Log in, returns a JWT |

### Protected (require a `token` header)
| Method | Route                              | Description                              |
|--------|------------------------------------|------------------------------------------|
| POST   | `/organization`                    | Create an organization (creator = admin) |
| GET    | `/organization?organizationId=`    | View an organization (admin only)        |
| POST   | `/add-member-to-organization`      | Add a member by username (admin only)    |
| DELETE | `/remove-member-from-organization` | Remove a member by username (admin only) |
| POST   | `/board`                           | Create a board under an organization     |
| GET    | `/board?organizationId=`           | List boards for an organization          |
| POST   | `/issues`                          | Create an issue on a board               |
| GET    | `/issues?boardId=`                 | List issues for a board                  |
| PUT    | `/issues`                          | Advance an issue's status                |

## How Authentication Works

1. On signin, the server signs a JWT containing the user's id and returns it.
2. The frontend stores the token in `localStorage`.
3. Every request to a protected route sends the token in the `token` header.
4. `authMiddleware` verifies the token, extracts the user id, and attaches it to
   `req.userId` before the route runs. Identity always comes from the verified
   token — never from the request body.

## Known Limitations

- The JWT secret and MongoDB connection string are hardcoded; in production these
  should be environment variables.
- The app runs locally only. Deploying it would require a cloud database
  (e.g. MongoDB Atlas) and a host such as Render.

## Author

Hari Prasaad — github.com/hariprasaad2000
