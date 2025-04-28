# Food Waste Reduction Platform

A full-stack web application that connects restaurants with excess food to NGOs and food banks that can redistribute it to those in need.

## Overview

This platform aims to reduce food waste by providing a simple way for restaurants to donate excess food and for NGOs/food banks to claim and distribute it. The application features:

- User registration as either a restaurant (donor) or NGO/food bank (receiver)
- Restaurant dashboard to upload food donations with photos and descriptions
- Food safety guidelines acknowledgment for each donation
- NGO dashboard to view, claim, and track food donations
- Automatic expiration of food posts after 24 hours
- Rating system for NGOs to rate restaurants after receiving donations

## Technology Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd food-waste-reduction
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
food-waste-reduction/
├── app/               # Next.js App Router
│   ├── api/           # API Routes
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   ├── restaurant-dashboard/  # Restaurant dashboard
│   ├── ngo-dashboard/ # NGO dashboard
│   └── ...
├── components/        # Reusable React components
├── lib/               # Utility functions and database connection
├── models/            # Mongoose models
└── styles/            # Global CSS and Tailwind config
```

## Features

### User Registration and Authentication

- Email and password authentication
- Role-based access (restaurant or NGO)
- Protected routes based on user role

### Restaurant Features

- Upload food donations with details and photo
- View donation history with status indicators
- Accept food safety guidelines for each donation
- View other participating restaurants and their ratings

### NGO/Food Bank Features

- Browse available food donations
- Claim food for pickup
- Mark donations as received
- Rate restaurants after receiving food

## API Endpoints

### Authentication
- `POST /api/auth/...` - NextAuth.js authentication endpoints

### User Management
- `POST /api/register` - Register a new user (restaurant or NGO)

### Food Donations
- `GET /api/food` - Get food donations (filterable by status)
- `POST /api/food` - Create a new food donation
- `GET /api/food/:id` - Get a specific food donation
- `PATCH /api/food/:id` - Update a food donation status

### Ratings
- `GET /api/rating?ratedId=<userId>` - Get ratings for a user
- `POST /api/rating` - Create a new rating

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 