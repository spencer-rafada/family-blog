# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

Family-blog is a web application that allows users to create, manage, and share family albums to selected family members and friends.

## Bash Commands

- `npm run build` - Build the project
- `npm run lint` - Lint the project
- `npm run dev` - Run the project in development mode
- `npm run start` - Run the project in production mode

## Testing Instructions

- Practice Test-Driven Development. Use Jest and React Testing Library.
- We will be using Red-Green-Refactor method. Write tests before writing the code. Ask the user for approval before proceeding to write code. Continue to commit the tests and code in separate commits. The tests should be committed first. The tests do not need to pass before the code is written.
- The tests does not need to get 100% coverage. The tests should be written to test the functionality of the code. The tests should be written to test the code in isolation.

## Project Structure

- Keep `/src/app` directory clean and only add pages, layouts, and routes to it. Refer to Next.js documentation for more information. Use `context7` MCP to look up latest Next.js documentation.
- Keep `/src/components` directory almost as similar to `src/app` directory. Keep reusable components in `/src/components` directory and page-specific components in their respective pages. Example: `/src/app/albums/page.tsx` should have a component called `Albums` and it should be stored in `src/components/albums/`.
- Add all of the utily functions in `src/lib` directory.

## Architecture & Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Data Fetching**: SWR for client-side data fetching, Server Actions for mutations
- **Email**: Resend for email notifications
- **Validation**: Zod schemas
- **Form Handling**: React Hook Form with Zod resolvers

## Database Schema

The application uses Supabase with the following main entities:

- **profiles**: User profiles linked to Supabase auth
- **albums**: Collections of posts with privacy levels (public/private)
- **posts**: Individual posts with content, images, and milestone types
- **post_images**: Multiple images per post with captions and ordering
- **comments**: Comments on posts
- **likes**: Post likes
- **album_members**: User memberships in albums with roles (admin/contributor/viewer)
- **album_invites**: Token-based invitations to join albums

## Authentication & Authorization

- Uses Supabase Auth with profile creation on signup
- Role-based permissions system for albums:
  - **ADMIN**: Full permissions (create/edit/delete album, manage members, create posts)
  - **CONTRIBUTOR**: Can create posts but cannot manage album/members
  - **VIEWER**: Read-only access
- Album creators are automatically admins
- Middleware protection on routes in `src/lib/supabase/middleware.ts`
- Permission helpers in `src/lib/permissions.ts`

## Data Fetching Patterns

- **Client-side**: SWR hooks in `src/lib/hooks/` for real-time data
- **Server-side**: Server Actions in `src/lib/actions/` for mutations
- **API Routes**: RESTful endpoints in `src/app/api/` for complex operations
- SWR keys defined in `src/lib/constants.ts`

## Key Features

- **Album Management**: Create private/public albums with member invitations
- **Post Creation**: Multi-image posts with captions and milestone categorization
- **Invite System**: Email-based invitations with token validation
- **Comments & Likes**: Social features for family engagement
- **Responsive Design**: Mobile-first approach with shadcn/ui components

## Important Patterns

- Server Actions use `requireAuth()` for authentication
- RLS policies enforce database security
- Custom RPC functions bypass RLS for specific operations (album creation, invite handling)
- Email invitations are sent asynchronously and don't block operations
- File uploads use Supabase Storage with organized folder structure

## Development Notes

- Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Uses TypeScript strict mode
- Follows Next.js App Router conventions
- Components use shadcn/ui design system
- Form validation with Zod schemas
- Error handling with try/catch and user-friendly messages

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.