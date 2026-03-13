import { Hono } from 'hono'
// import { env } from 'hono/adapter'
import { env } from "cloudflare:workers";
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { jwt } from 'hono/jwt'
import { cors } from 'hono/cors'

import type { JwtVariables } from 'hono/jwt'

import { Client } from "@notionhq/client"
import { resolveCallback } from 'hono/utils/html';



type Bindings = {
  HASHED_PASSWORD: string;
};

// type Variables = JwtVariables

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: 'http://127.0.0.1:5500',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
  })
)

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
      "success": true,
    });
  } else {
    return c.json({
      "success": false,
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

app.post('/edit-name', async (c) => {
  const { password, artwork_name, new_name } = await c.req.json();

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
      }
    })

    const page_id = page.results[0].id
    // const id = page.results[0].properties

    const response = await notion.pages.update({
      page_id: page_id,
      "properties": {
        "Artwork Name": {
          "title": [
            {
              "text": {
                "content": new_name
              }
            }

          ]
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


app.post('/edit-for', async (c) => {
  const { password, artwork_name, new_for } = await c.req.json();

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
      }
    })

    const page_id = page.results[0].id

    const response = await notion.pages.update({
      page_id: page_id,
      "properties": {
        "Who is it for?": {
          "rich_text": [
            {
              "text": {
                "content": new_for
              }
            }
          ]
        }
      }
    })

    return c.json({
      response,
    });
  } else {
    return c.json({
      error: 'Invalid password'
    })
  }
})

app.post('/edit-deadline', async (c) => {
  const { password, artwork_name, new_deadline } = await c.req.json();

  const HASHED_PASSWORD = env.HASHEDPASSWORD

  const match = await bcrypt.compare(password, HASHED_PASSWORD)

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
      }
    })

    const page_id = page.results[0].id

    const response = await notion.pages.update({
      page_id: page_id,
      "properties": {
        "Deadline": {
          "date": {
            "start": new_deadline
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

app.get('/get-data', async (c) => {
  const database = await notion.databases.retrieve({
    database_id: "309544e9361b8045bb67d8f24a86cbe6"
  })

  const data_source_id = database.data_sources[0].id

  const pages = await notion.dataSources.query({
    data_source_id: data_source_id,
  })

  // const pages = JSON.parse(JSONpages);

  let data = {
    results: []
  }

  pages.results.forEach(page => {
    let result = {};
    // console.log(page)
    Object.entries(page.properties).forEach(([key, value]) => {
      switch (key) {
        case "Artwork Name":
          console.log("Artwork Name:", value.title?.[0]?.plain_text)
          result.artwork_name = value.title?.[0]?.plain_text
          break
        case "Who is it for?":
          console.log("Who is it for?", value.rich_text?.[0]?.plain_text)
          result.who_is_it_for = value.rich_text?.[0]?.plain_text
          break
        case "Status":
          console.log("Status:", value.select?.name)
          result.status = value.select?.name
          break
        case "Deadline":
          console.log("Deadline:", value.date?.start)
          result.deadline = value.date?.start
          break
        
        default:
          console.log("else")
        
      }

    })
    console.log("-----")
    data.results.push(result)
  })

  // Object.entries(database.properties).forEach(([propertyName, propertyValue]) => {
  //   console.log(`${propertyName}: ${propertyValue.type}`);
  // })



  return c.json({
    data,
  })
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




export default app
