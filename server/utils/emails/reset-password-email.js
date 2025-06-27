const resetPasswordHTML = (resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #333;
    }
    p {
      color: #555;
      font-size: 16px;
    }
    .btn {
      display: inline-block;
      padding: 12px 25px;
      margin-top: 20px;
      background-color: #007bff;
      color: white;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password.</p>
    <p>If this was you, click the button below:</p>
    <a href="${resetLink}" class="btn">Reset Password</a>
    <p>If you didn’t request this, just ignore this email.</p>
    <p class="footer">This link will expire in 1 hour.<br />&copy; ${new Date().getFullYear()} Your Company</p>
  </div>
</body>
</html>
`;

module.exports = resetPasswordHTML;
