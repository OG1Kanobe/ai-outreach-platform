export default {
    providers: [
      {
        // This tells Convex "If a request comes from this URL, it's my app"
        domain: process.env.CONVEX_SITE_URL,
        applicationID: "convex",
      },
    ],
  };