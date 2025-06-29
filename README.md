# PV Tracker

## Description
PV (Photovoltaic) Tracker is a web application designed to manage and track solar panel installed positions. Built with Next.js, React, and a PostgreSQL database, the application aims to streamline the process of monitoring and maintaining solar panel projects.

## Features
*   **Profile Management:** Create, edit, and delete project profiles to organize.
*   **Panel Data Upload:** Upload solar panel data via CSV or Excel files.
*   **Interactive Dashboard:** View key statistics and insights related to solar panel installed positions.
*   **Panel Table View:** Browse and manage detailed information about individual solar panels.
*   **NFC Tool Integration:** Support for NFC-enabled scanning of solar panels.
*   **RESTful API:** Robust API endpoints for managing profiles and panel data.
*   **Modern UI:** Built with Shadcn UI and Tailwind CSS for a responsive and aesthetically pleasing user experience.

## Installation

To set up the project locally, follow these steps:

### Prerequisites
*   Node.js (version 18.17.0 or higher)
*   npm 
*   A PostgreSQL database (e.g., NeonDB)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/muhdfaqris/pv-tracker.git
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root of the `pv-tracker` directory and add your database connection string:
    ```
    DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
    ```
    Get your DATABASE_URL via [neon](https://console.neon.tech/).

4.  **Set up the database schema:**
    Run the SQL script to create the necessary tables in your PostgreSQL database.
    ```bash
    npm run migrate
    ```

## Usage

### Development Server

To run the application in development mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

To build the application for production:

```bash
npm run build
```

### Starting Production Server

To start the built application in production mode:

```bash
npm start
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License
This project is licensed under the MIT License.
