<!DOCTYPE html>
<html>
<head>
    <title>EduFlow School Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #6366f1;">Welcome to EduFlow CRM!</h2>
        <p>Hello <strong>{{ $user->first_name }} {{ $user->last_name }}</strong>,</p>
        <p>Your account has been successfully created. Here are your login credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username / Email:</strong> {{ $user->email }}</p>
            <p style="margin: 5px 0 0 0;"><strong>Password:</strong> {{ $password }}</p>
            <p style="margin: 5px 0 0 0;"><strong>Role:</strong> {{ $user->role->name ?? 'User' }}</p>
        </div>

        <p>You can log in to your dashboard using the link below:</p>
        <p>
            <a href="{{ env('VITE_APP_URL', 'http://localhost:5173') }}" style="display: inline-block; background-color: #6366f1; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to EduFlow</a>
        </p>

        <p style="font-size: 0.9em; color: #777; margin-top: 30px;">
            If you have any issues, please contact the school administration.
        </p>
    </div>
</body>
</html>
