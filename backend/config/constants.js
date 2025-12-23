module.exports = {
  APP_KEY: process.env.APP_KEY || '503646',
  APP_SECRET: process.env.APP_SECRET || 'GRM2aosy8VXIV0xzclq6loMKeaRAv996',
  
  REGION_ENDPOINTS: {
    myanmar: "https://api.shop.com.mm/rest",
    bangladesh: "https://api.daraz.com.bd/rest",
    pakistan: "https://api.daraz.pk/rest",
    sri_lanka: "https://api.daraz.lk/rest",
    srilanka: "https://api.daraz.lk/rest",
    nepal: "https://api.daraz.com.np/rest",
  },
  
  DEFAULT_REGION: "pakistan",
  
  FIREBASE_DATABASE_URL: "https://dseller-c21ee-default-rtdb.firebaseio.com",
  
  PORT: process.env.PORT || 3001,
  
  SWAGGER_SERVER_URL: process.env.SWAGGER_SERVER_URL || "http://localhost:3001",
};

