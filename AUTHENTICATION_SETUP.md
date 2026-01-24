# Authentication System Setup

## Overview

The application now uses Supabase Authentication with email/password login. All database operations are protected by Row Level Security (RLS) and require authenticated users.

## What Was Implemented

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
- Manages user session state
- Provides sign in, sign up, and sign out functions
- Automatically tracks authentication state changes
- Stores user data in the `usuarios` table upon registration

### 2. Login & Sign Up Pages
- **Login Page** (`src/pages/Auth/Login.tsx`): Email/password login form
- **Sign Up Page** (`src/pages/Auth/SignUp.tsx`): User registration form
- Both pages include error handling and loading states

### 3. Protected Routes
- App.tsx now requires authentication before showing any content
- Unauthenticated users see the login page
- Authenticated users can access the full application

### 4. User Interface Updates
- Header shows the logged-in user's email
- Logout button in the header user menu
- Proper loading states during authentication

### 5. Database Security
- RLS is enabled on all tables
- Policies require authentication for all operations
- Only logged-in users can create, read, update, or delete records

## How to Use

### First Time Setup

1. **Create an account:**
   - Open the application
   - Click "Registrarse" on the login page
   - Fill in your name, email, and password (minimum 6 characters)
   - Click "Crear Cuenta"
   - You'll be automatically redirected to login

2. **Login:**
   - Enter your email and password
   - Click "Iniciar Sesión"
   - You'll be taken to the dashboard

3. **Create clients and projects:**
   - Now that you're authenticated, you can create clients from the wizard
   - The RLS error "new row violates row-level security policy" is resolved
   - All database operations will work correctly

### Logout

- Click on your email in the top-right corner of the header
- Select "Cerrar Sesión" from the dropdown menu

## Important Notes

### Email Confirmation

By default, Supabase may require email confirmation for new signups. If you encounter issues:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Under "Email Auth", disable "Confirm email"
4. This allows immediate login after signup without email verification

### Default User Role

New users are automatically assigned the "gestor" role in the `usuarios` table. This role has full access to manage clients, projects, and expedientes.

### Session Persistence

The authentication session is automatically saved in the browser's local storage. Users remain logged in even after closing and reopening the browser.

## Technical Details

### Authentication Flow

1. User enters credentials
2. Supabase Auth validates and creates a session
3. Session token is stored in local storage
4. All database requests include the session token
5. RLS policies check if the user is authenticated
6. If authenticated, operations are allowed

### RLS Policy Structure

All tables use this policy pattern:
```sql
CREATE POLICY "Allow all operations for authenticated users"
  ON table_name
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

This means:
- Anonymous users: No access
- Authenticated users: Full access to all records

This is appropriate for a staff management system where authenticated employees need to manage all client data.

### Future Enhancements

If you need more granular permissions in the future, you can:
- Add role-based policies (admin, gestor, despachante, cliente)
- Implement record-level permissions (users can only see their own clients)
- Add team-based access control (users only see their team's projects)

## Troubleshooting

### "Invalid login credentials"
- Check that the email and password are correct
- Ensure the user account was created successfully

### "User already registered"
- This email is already in use
- Try logging in instead of signing up
- Or use a different email address

### Still getting RLS errors after login
- Make sure you're logged in (check for your email in the header)
- Try logging out and back in
- Check the browser console for any error messages

## Summary

The authentication system is fully functional and resolves the RLS policy error you were experiencing. You can now:

1. Create user accounts
2. Log in securely
3. Create clients, products, and projects without RLS errors
4. Manage all aspects of the application as an authenticated user
