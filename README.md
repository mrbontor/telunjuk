# telunjuk
api point


##Technologies:

- Docker and docker-compose
- NodeJS
- AJV (For user input validation)
- MongoDB (Database)

I used Docker to make it easier to develop the API Service

there are 2 main API,
- USER, `/api/users`
- POINT, `/api/points/:userID`


for user API, there are 4 Methods, POST, PUT, GET and delete
for point API, there are 2 methods, GET and PATCH

the first you need to is create a user, `POST /api/users`

it will instantly create a new collection, `point`

When user wanna update the point, you will need the userID with format ObjectId of MongoDB

example:

PATCH `/api/points/625d8da3033ee7eeb6464605`
```
body

{
    "point": 4,
    "type": "increase"
}
```

for field `type`, its enum type. `increase` and `decrease`
for field `point`, its number type

please check the `telunjuk.json` for more detail of the API


## Deployment

this service is using Docker

to run the service, you will need to run this command

```bash
$ docker-compose up
```

or

```bash
$ docker-compose up --build
```

if everything goes well, than you can hit the API list.
