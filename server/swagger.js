const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Team Alpha API",
      version: "1.0.0",
      description: "Team Alpha Profile Card API Documentation",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
      {
        url: "https://team-alpha-profile-card-auth-api-pt9r.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "routes", "*.js")], // ✅ Includes ALL route files
};

const swaggerSpec = swaggerJSDoc(options);
console.log("✅ Swagger loaded paths:", Object.keys(swaggerSpec.paths)); // optional debug

module.exports = swaggerSpec;
