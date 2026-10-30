const bcrypt = require("bcryptjs");
const db = require("./db");

async function createUser() {
    const email = "admin@test.com";
    const password = "admin123";

    const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    (err) => {
      if (err) {
        console.error();
      } else {
      console.log("Admin created");
    }
    process.exit();
        }
  );
}

createUser();
