# Repo Surfer

Repo Surfer is a Next.js application that allows users to sign in with their GitHub account and view a list of their public repositories. It demonstrates GitHub OAuth 2.0 integration within a full-stack Next.js environment.

## Features

- Sign in with GitHub using OAuth 2.0
- Display logged-in user's GitHub name and avatar
- List public repositories of the logged-in user
- Secure handling of access tokens using HTTP-only cookies
- Protected dashboard route
- Clean, modern UI using Tailwind CSS and ShadCN UI components

## Tech Stack

- **Frontend**: Next.js (React)
- **Backend**: Next.js API Routes
- **Styling**: Tailwind CSS, ShadCN UI
- **GitHub API**: Octokit.js
- **Authentication**: GitHub OAuth 2.0

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd repo-surfer 
    ```
    (Replace `<repository_url>` with the actual URL of this repository if it's hosted)

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up GitHub OAuth App:**
    *   Go to your GitHub account settings.
    *   Navigate to **Developer settings** > **OAuth Apps**.
    *   Click **New OAuth App**.
    *   Fill in the application details:
        *   **Application name**: e.g., Repo Surfer (Dev)
        *   **Homepage URL**: `http://localhost:3000` (or your `NEXT_PUBLIC_APP_URL` if different for development)
        *   **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback` (or `NEXT_PUBLIC_APP_URL/api/auth/github/callback`)
    *   After creating the app, you will get a **Client ID** and you'll need to generate a **Client Secret**. Note these down.

4.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the root of the project by copying the example file:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and fill in your GitHub OAuth App credentials and other settings:
        ```env
        GITHUB_CLIENT_ID=your_github_client_id
        GITHUB_CLIENT_SECRET=your_github_client_secret
        NEXT_PUBLIC_APP_URL=http://localhost:3000 
        COOKIE_SECRET=generate_a_strong_random_string_here 
        ```
        - `GITHUB_CLIENT_ID`: Your GitHub OAuth App's Client ID.
        - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App's Client Secret.
        - `NEXT_PUBLIC_APP_URL`: The base URL of your application during development (usually `http://localhost:3000`). Ensure this matches the URLs used in your GitHub OAuth App setup.
        - `COOKIE_SECRET`: A long, random, secret string used for securing cookies or other purposes. You can generate one using a password manager or a command like `openssl rand -hex 32`.

5.  **Run the application:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application should now be running on `http://localhost:3000` (or the port specified in your `dev` script / `NEXT_PUBLIC_APP_URL`).

## Project Structure

- `src/app/`: Contains the pages and API routes (App Router).
  - `(pages)/`: Route groups for pages like `/` (login) and `/dashboard`.
  - `api/auth/`: API routes for GitHub OAuth flow (`login`, `callback`, `logout`).
- `src/components/`: Reusable React components.
  - `auth/`: Authentication related components (LoginButton, LogoutButton).
  - `dashboard/`: Components for the dashboard (UserProfileCard, RepoCard).
  - `layout/`: Layout components (AppHeader).
  - `ui/`: ShadCN UI components.
- `src/lib/`: Utility functions, constants, and GitHub API helpers.
  - `constants.ts`: Application-wide constants.
  - `github.ts`: Functions for interacting with GitHub API using Octokit.
- `src/types/`: TypeScript type definitions.
- `public/`: Static assets.
- `middleware.ts`: Next.js middleware for protecting routes.

## How It Works

1.  **Login**: The user clicks "Sign in with GitHub" on the home page (`/`).
2.  This action hits the `/api/auth/github/login` API route, which redirects the user to GitHub's authorization page. A `state` parameter is generated and stored in an HTTP-only cookie for CSRF protection.
3.  **GitHub Authorization**: The user authorizes the application on GitHub.
4.  **Callback**: GitHub redirects the user back to `/api/auth/github/callback` with an authorization `code` and the `state`.
5.  The callback route validates the `state`, then exchanges the `code` for an access token with GitHub.
6.  This access token is securely stored in an HTTP-only cookie (`auth_token`).
7.  The user is redirected to the `/dashboard` page.
8.  **Dashboard**: The `/dashboard` page is a server component.
    *   Middleware (`middleware.ts`) protects this route, redirecting unauthenticated users to the login page.
    *   The page reads the access token from the cookie.
    *   It uses the access token to fetch the user's profile information and public repositories from the GitHub API via `src/lib/github.ts`.
    *   The fetched data is then displayed.
9.  **Logout**: The user clicks "Sign Out". This hits the `/api/auth/logout` API route, which clears the `auth_token` cookie and redirects the user to the login page.

Enjoy surfing your repos!
