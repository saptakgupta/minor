# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Node.js backend API

## Backend API and Realtime Map

The backend is a Node.js REST API that uses `src/data/parkingData.ts` as the file-backed database. Slot and booking changes are persisted back into that file and broadcast to the frontend through Server-Sent Events.

Run the frontend:

```sh
npm run dev
```

Run the backend:

```sh
npm run server
```

Useful API routes:

- `GET /api/health`
- `GET /api/events`
- `GET /api/stats`
- `GET /api/slots`
- `GET /api/slots/:id`
- `POST /api/slots`
- `PATCH /api/slots/:id`
- `DELETE /api/slots/:id`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`
- `DELETE /api/bookings/:id`

The frontend defaults to `http://127.0.0.1:3001/api`. To override it, set:

```sh
VITE_API_URL=http://127.0.0.1:3001/api
```

Realtime demo flow:

1. Open `/availability` in one browser tab.
2. Open `/admin/slots` in another tab.
3. Change any slot status in the admin tab.
4. The parking map updates automatically in the availability tab.

Create a booking:

```sh
curl -X POST http://127.0.0.1:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"slotId\":\"A-01\",\"vehicleNumber\":\"MH12AB1234\",\"entryTime\":\"09:00\",\"duration\":2}"
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
