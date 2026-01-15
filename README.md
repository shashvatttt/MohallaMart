# MohallaMart
https://www.mohallamart.store/

MohallaMart is a modern, community-driven e-commerce platform that connects local buyers and sellers. It features real-time messaging, community groups, and a seamless shopping experience.

## Features

- **Storefront**: Browse and search for products from local sellers.
- **Communities**: Join and interact with community groups.
- **Real-time Chat**:
    -   Instant messaging between users.
    -   Unread message indicators and badges.
    -   Typing indicators and online status (planned).
- **User Authentication**: Secure signup and login functionality.
- **Product Management**: Create and manage product listings with image uploads.

## Tech Stack

### Frontend
-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Real-time**: Socket.io Client
-   **Icons**: Lucide React
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
-   **Real-time**: Socket.io
-   **Authentication**: JWT (JSON Web Tokens) & Bcrypt
-   **File Storage**: Cloudinary (via Multer)

## Getting Started

### Prerequisites
-   Node.js (v18 or higher)
-   MongoDB Atlas account (or local instance)
-   Cloudinary account

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/MohallaMart.git
    cd MohallaMart
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory with the following variables:
    ```env
    PORT=5001
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    FRONTEND_URL=http://localhost:3000
    ```
    Start the server:
    ```bash
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `.env.local` file in the `frontend` directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5001/api
    ```
    Start the application:
    ```bash
    npm run dev
    ```

4.  **Access the App**
    Open `http://localhost:3000` in your browser.

## Project Structure

```
MohallaMart/
├── backend/         # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── sockets/
├── frontend/        # Next.js client application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── store/
```
