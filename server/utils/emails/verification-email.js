const verifyEmailHTML = (verificationLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Account</title>
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
    .btn {
      display: inline-block;
      padding: 12px 25px;
      background-color: #28a745;
      color: white;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
    }
    .footer {
      font-size: 12px;
      color: #888;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Your Email</h2>
    <p>Click the button below to verify your email address and activate your account.</p>
    <a href="${verificationLink}" class="btn">Verify Email</a>
    <p class="footer">If you didn't request this, you can safely ignore this email.</p>
    <p class="footer">© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
  </div>
</body>
</html>
`;
module.exports = verifyEmailHTML;
