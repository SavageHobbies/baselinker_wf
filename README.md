# Project Setup

This project requires certain environment variables to be configured for database and API access.

## Environment Configuration

1.  **Create your environment file:**
    Copy the example environment file to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```

2.  **Populate your `.env` file:**
    Open the `.env` file with a text editor and fill in your actual credentials. It will look like this:

    ```env
    DB_HOST=your_database_host
    DB_PORT=your_database_port
    DB_NAME=your_database_name
    DB_USER=your_database_user
    DB_PASSWORD=your_database_password
    BASELINKER_API_TOKEN=your_baselinker_api_token
    ```
    Replace `your_database_host`, `your_database_password`, etc., with your specific details.

## PHP Dependencies

The PHP scripts rely on external libraries managed by Composer.

1.  **Install dependencies:**
    Navigate to the `baselinker_api` directory and run composer install:
    ```bash
    cd baselinker_api
    composer install
    cd .. 
    ```
    This will download and install the necessary PHP packages, including `phpdotenv` which is used to load the environment variables.

Once these steps are completed, the PHP scripts should be able to connect to the database and the Baselinker API using the credentials you've provided in the `.env` file.
