# ExpressJs Core

ExpressJs Core is a basic source code, using node-express

## Requirements

-   node ~ 16.20.2
-   npm ~ 8.19.4

## Usage

1. Clone project
2. Create `.env` file, copy content from `.env.example` to `.env` file and config in `.env`:

-   Config Runtime Environment

```bash
# development or production
NODE_ENV=
```

-   Config MongoDb Database

```bash
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
```

-   Config Project

```bash
PORT=
SECRET_KEY=
# expressed in seconds or a string describing a time span
# Eg: 60, "2 days", "10h", "7d"
JWT_EXPIRES_IN=
# Time in seconds to check all data and delete expired keys
TIME_TO_CHECK_PERIOD=
```

3. Install package & setup

```bash
npm install
```

4. Initialize data (Required for new database)

```bash
npm run seed
```

5. Runs the app

```bash
npm run start
```

> Note: run with `development` mode (NODE_ENV=development)

6. Builds the app for production to the `build` folder

```bash
npm run build
```

7. Runs the app on `production` mode

```
node build/index.js
```

> Note: remember set NODE_ENV=production in `.env` file

8. Default account

```yaml
Email: admin@zent.vn
Password: Zent@123.edu.vn
```

## Credits

[ZentSoft](https://zentsoft.com).
