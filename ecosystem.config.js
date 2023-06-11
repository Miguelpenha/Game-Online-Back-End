module.exports = {
    apps : [{
      name: "Game-Online",
      script: "dist/index.js",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }]
}