# Godot Game Backend Server

## Running Locally

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```

## Deploying to Heroku

1. Create a Heroku app:
   ```sh
   heroku create
   ```
2. Push to Heroku:
   ```sh
   git push heroku master
   ```

## API Endpoints

- `POST /upload` — Upload user data
- `GET /data/:user` — Get user data

## Connecting from Godot

Example GDScript:
```gdscript
var http = HTTPRequest.new()
add_child(http)

func upload_data(user, data):
    var json = to_json({"user": user, "data": data})
    http.request("https://<your-app>.herokuapp.com/upload", [], true, HTTPClient.METHOD_POST, json)
```