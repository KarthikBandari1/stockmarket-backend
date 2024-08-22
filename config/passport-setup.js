const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const db = new sqlite3.Database(":memory:");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Find or create user in database
      db.get(
        "SELECT * FROM users WHERE email = ?",
        [profile.emails[0].value],
        (err, user) => {
          if (err) return done(err);
          if (user) return done(null, user);

          db.run(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            [profile.displayName, profile.emails[0].value],
            function (err) {
              if (err) return done(err);
              return done(null, {
                id: this.lastID,
                name: profile.displayName,
                email: profile.emails[0].value,
              });
            }
          );
        }
      );
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    done(err, user);
  });
});
