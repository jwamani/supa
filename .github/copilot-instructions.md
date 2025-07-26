<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Supabase Learning Project

This is a beginner-friendly Supabase learning project built with React, TypeScript, and Vite.

## Key Concepts Covered

1. **Database Operations (CRUD)**: Create, Read, Update, Delete operations using Supabase
2. **Authentication**: User sign up, sign in, sign out with email/password
3. **Real-time Subscriptions**: Live updates using Supabase channels
4. **Environment Configuration**: Secure credential management

## Project Structure

- `src/lib/supabaseClient.ts` - Supabase client configuration
- `src/SupabaseTest.tsx` - Connection testing component
- `src/TodoApp.tsx` - CRUD operations demo with todos
- `src/AuthDemo.tsx` - Authentication flow demonstration
- `src/RealtimeDemo.tsx` - Real-time messaging demo
- `.env.local` - Environment variables (not in git)

## Development Guidelines

- Use TypeScript for type safety
- Follow React hooks patterns
- Handle errors gracefully with user-friendly messages
- Include SQL table creation instructions in error messages
- Use inline styles for simplicity in learning components
- Add educational comments and explanations in components
