import { Elysia, t } from "elysia";
import { BooksDatabase } from "./db";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";

class Unauthorized extends Error {
  constructor() {
    super("Unauthorized");
  }
}

const app = new Elysia()
  .error({
    "401": Unauthorized,
  })
  .onError(({ code, error }) => {
    let status;
    switch (true) {
      case code === "VALIDATION":
        status = 400;
        break;
      case code === "NOT_FOUND":
        status = 404;
        break;
      case code === "401":
        status = 401;
        break;
      default:
        status = 500;
        break;
    }

    return new Response(error.toString(), { status: 401 });
  })
  .use(cookie())
  .use(
    jwt({
      name: "jwt",
      secret: "super",
    })
  )
  .decorate("db", new BooksDatabase());

app.get("/books", ({ db }) => db.getBooks());

app.post("/books", ({ db, body }) => db.addBook(body), {
  body: t.Object({
    name: t.String(),
    author: t.String(),
    id: t.Number(),
  }),
});

app.put(
  "/books",
  ({ db, body }) =>
    db.updateBook(body.id, { name: body.name, author: body.author }),
  {
    body: t.Object({
      id: t.Number(),
      name: t.String(),
      author: t.String(),
    }),
  }
);

app.get("/books/:id", async ({ db, params, jwt, cookie: { auth } }) => {
  const profile = await jwt.verify(auth);
  if (!profile) throw new Unauthorized();
  return db.getBook(parseInt(params.id));
});

app.delete("/books/:id", ({ db, params }) =>
  db.deleteBook(parseInt(params.id))
);

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
