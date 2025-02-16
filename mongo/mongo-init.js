db.dropDatabase();

db.createUser({
  user: process.env.MONGO_LOGIN,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_DB_NAME,
    },
  ],
});
