# Express API Server

This is an Express.js API server that provides various endpoints for user authentication, course details, attendance tracking, calendar events, day order, marks, and timetables. The server includes caching, rate limiting, and token-based authentication.

## Live Server

The API is hosted at:(http://ec2-3-7-248-136.ap-south-1.compute.amazonaws.com)

## Features

- User authentication (login & logout)
- Fetch course details
- Retrieve calendar events
- Get the day's order
- Fetch student marks
- Attendance tracking
- Retrieve timetable information
- Get user details
- Caching for performance optimization
- Rate limiting for security
- **SRM Academia Scraper:** This repository contains APIs for scraping data from SRM Academia.

## Technologies Used

- **Node.js** with **Express.js**
- **Axios** for HTTP requests
- **CORS** for cross-origin requests
- **dotenv** for environment variable management
- **express-rate-limit** for rate limiting
- **compression** for response compression

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/anuj-rishu/SRM-Academia-Scrap-node-
   SRM-Academia-Scrap-node-
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and configure the following environment variables:
   ```env
   PORT=9000
   DEV_MODE=true
   URL=http://yourfrontend.com
   ```
4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

| Method | Endpoint      | Description            |
| ------ | ------------- | ---------------------- |
| GET    | `/hello`      | Test route             |
| POST   | `/login`      | User login             |
| DELETE | `/logout`     | User logout            |
| GET    | `/courses`    | Get courses list       |
| GET    | `/calendar`   | Get calendar events    |
| GET    | `/dayorder`   | Get today's day order  |
| GET    | `/marks`      | Get student marks      |
| GET    | `/attendance` | Get attendance details |
| GET    | `/timetable`  | Get timetable data     |
| GET    | `/user`       | Get user information   |

## Middleware

- **Token Middleware:** Ensures requests include an `X-CSRF-Token`.
- **Cache Middleware:** Caches GET requests for 2 minutes.
- **Rate Limiting:** Limits requests to 100 per 15 minutes.

## Contributing

Contributions are welcome! If you have any improvements or new features to add, feel free to open a pull request.

## License

This project is licensed under the Apache License.

