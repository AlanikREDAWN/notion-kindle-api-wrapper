import { Hono } from 'hono'
// import { env } from 'hono/adapter'
import { env } from "cloudflare:workers";
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { jwt } from 'hono/jwt'

import type { JwtVariables } from 'hono/jwt'

import { Client } from "@notionhq/client"
import { resolveCallback } from 'hono/utils/html';



type Bindings = {
  HASHED_PASSWORD: string;
};

// type Variables = JwtVariables

const app = new Hono<{ Bindings: Bindings }>()

const notion = new Client({ auth: env.NOTIONAPIKEY, fetch: (...args) => fetch(...args), })


app.post('/verify-password', async (c) => {

  const { password } = await c.req.json();
  const HASHED_PASSWORD = env.HASHEDPASSWORD

  const match = await bcrypt.compare(password, HASHED_PASSWORD);

  

  const response = await notion.databases.retrieve({
    database_id: "309544e9361b8045bb67d8f24a86cbe6"
  })

  if (match) {
    return c.json({
      response,
    });
  } else {
    return c.json({
      error: 'Invalid password'
    });
  }
})

app.post('/edit-status', async (c) => {
  const { password, artwork_name, new_status } = await c.req.json();

  const HASHED_PASSWORD = env.HASHEDPASSWORD

  const match = await bcrypt.compare(password, HASHED_PASSWORD);

  if (match) {
  const database = await notion.databases.retrieve({
      database_id: "309544e9361b8045bb67d8f24a86cbe6"
    })

    const data_source_id = database.data_sources[0].id


    const page = await notion.dataSources.query({
      data_source_id: data_source_id,
      filter: {

        property: "Artwork Name",
        "title": {
          "equals": artwork_name
        }
        // select: { equals: artwork_name }
      }
    })

    const page_id = page.results[0].id
    const id = page.results[0].properties.Status.select.id
    const name = page.results[0].properties.Status.select.name

    const response = await notion.pages.update({
      page_id: page_id,
      "properties": {
        "Status": {
          "select": {
            "name": new_status
          }
        }
      }
    })

    return c.json({
      response,
    });
  } else {
    return c.json({
      error: 'Invalid password'
    });
  }

  
  


})

// app.use(
//   '/api/auth/*',
//   jwt({
//     secret: 'it-is-very-secret',
//     alg: 'HS256',
//   })
// )

app.get('/', (c) => {
  return c.text('Hello Cloudflare Workers!')
})

app.get('/api/hello', (c) => {
  return c.json({
    ok: true,
    message: 'Hello Hono!',
  })
})

app.post



export default app
