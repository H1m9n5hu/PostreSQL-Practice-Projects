import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Type your local server password here",
  port: 5432
});

db.connect();

async function checkVisisted() {
  const result = await db.query("Select country_code from visited_countries");
  let countries = [];
  result.rows.forEach((country)=>{
    countries.push(country.country_code);
  });
  return countries;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

// Insert New Country
app.post("/add", async(req, res) => {
  const countryName = req.body.country;

  try {
    const result = await db.query("Select country_code from countries where lower(country_name) like '%'||$1||'%';", [countryName.toLowerCase()]);
    let countryCode = result.rows[0].country_code;

    try{
      await db.query("Insert into visited_countries (country_code) values($1)", [countryCode]);
      res.redirect("/");
    } catch(err){
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again."
      })
    }
  } catch(err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again."
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
