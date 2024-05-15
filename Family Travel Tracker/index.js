import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Use your own local server password",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  return result.rows.find((user) => user.id == currentUserId);
}

async function getUsers(){
  const result = await db.query("SELECT * FROM users");
  let users = [];
  result.rows.forEach((user) => {
    users.push(user);
  });
  return users;
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries where visited_countries.user_id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
      countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  console.log(countries);  
  let users = await getUsers();
  console.log(users);
  const user = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: user.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = $1;",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try {
      /* SQL Query for inserting conditional based database */
      // await db.query(`INSERT INTO visited_countries (user_id, country_code)
      //   SELECT id, $1
      //   FROM users
      //   WHERE id = $2;`, [countryCode, currentUserId]
      // );

      await db.query(`INSERT INTO visited_countries (user_id, country_code) values ($1, $2)`, [currentUserId, countryCode]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      const user = await getCurrentUser();
      const users = await getUsers();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: user.color,
        error: "Country has already been added, try again."
      })
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    const user = await getCurrentUser();
    const users = await getUsers();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: user.color,
      error: "Country name does not exist, try again."
    });
  }
});

app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  console.log(req.body);
  const userName = req.body.name;
  const color = req.body.color;
  const result = await db.query(`Insert into users (name, color) values ($1, $2) returning *`, [userName, color]);
  currentUserId = result.rows[0].id;
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
