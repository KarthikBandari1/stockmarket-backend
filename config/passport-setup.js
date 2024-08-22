const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const sqlite3 = require("sqlite3").verbose();

// SQLite database setup
const db = new sqlite3.Database(":memory:");

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "706503932934-hngv4e9oehc4415m99o7rogndoq019hi.apps.googleusercontent.com",
      clientSecret: "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",
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
