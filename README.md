# Inventory Management & E-Commerce Application

A full-stack inventory management and e-commerce application built for the Nissi Computing Labs LLP Full-Stack Developer assignment.

The application supports two roles — **User** and **Admin** — with custom authentication, product browsing, cart and checkout flows, order management, inventory controls, Redis caching, and role-based access control.



## Live Demo

- **Frontend:** https://inventory-ecommerce-system.vercel.app/
- **Backend API:** https://inventory-ecommerce-system-api.onrender.com/

## Deployment

The application is deployed using the following setup:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Caching:** Redis
- **Frontend → API:** Vercel `/api` rewrite to the Render backend

## Screenshots

### Authentication

| Login | Create Account |
|---|---|
| <img width="1884" height="1035" alt="Screenshot 2026-09-29 202424" src="https://github.com/user-attachments/assets/df6c1c36-4151-4b86-9ee0-438136172fb1" /> |<img width="1855" height="937" alt="Screenshot 2026-09-29 202447" src="https://github.com/user-attachments/assets/ea30e28b-4ea3-4af1-9c09-79472d22362d" /> |



### Product Catalogue

<img width="1884" height="1035" alt="Screenshot 2026-09-29 202424" src="https://github.com/user-attachments/assets/c29206ba-50a6-414a-b021-3c35fae35cd6" />

### Product Details

<img width="1878" height="852" alt="Screenshot 2026-09-29 204102" src="https://github.com/user-attachments/assets/e1830e0e-7039-4e98-80a5-11c24681f4ac" />


### Cart

<img width="1850" height="909" alt="Screenshot 2026-09-29 204122" src="https://github.com/user-attachments/assets/366e5748-8f9a-49a4-ac6d-d9575f145d6a" />


### Order Confirmation

<img width="1734" height="779" alt="Screenshot 2026-09-29 204138" src="https://github.com/user-attachments/assets/36d81ed5-057d-4e2b-a27c-02c479e12d31" />


## Features

### User

- Register, login, and logout
- Browse available products
- Search, filter, sort, and paginate products
- View product details and stock status
- Add products to cart
- Update quantities and remove items
- Checkout and place orders
- View personal order history
- View individual order details and status
- Persist cart and order data through the backend

#<img width="1734" height="779" alt="Screenshot 2026-09-29 204138" src="https://github.com/user-attachments/assets/c6bd63ca-6d7f-4d0c-afb4-5d32a22855a5" />
<img width="1734" height="779" alt="Screenshot 2026-09-29 204138" src="https://github.com/user-attachments/assets/0230da16-5678-4c94-aa24-b3e89a76ab0e" />
## Admin

- Admin dashboard with store and inventory metrics
- Product catalogue management
- Create and edit products
- Disable products without removing historical order data
- Increase or decrease stock
- Prevent negative stock
- View inventory status
- Identify low-stock and out-of-stock products
- View inventory change history
- View and manage customer orders
- Update order status
- View registered users
- View transaction history

## Technical Highlights

### Authentication & Authorization

Authentication is implemented without a third-party auth provider.

- JWT-based authentication
- JWT stored in an HTTP-only cookie
- bcrypt password hashing
- Authentication middleware
- Role-based authorization middleware
- Admin APIs protected on the backend
- Users can only access their own orders

### Inventory Safety

Inventory is validated both during cart operations and again during checkout.

Order placement:

1. Authenticates the user
2. Validates the requested products
3. Reads the latest product prices from MongoDB
4. Checks current stock
5. Atomically reduces stock
6. Creates the order and order items
7. Records the transaction
8. Records inventory history
9. Clears the cart
10. Invalidates relevant product cache entries

This prevents stale cart data from bypassing the final stock check and avoids relying on client-supplied prices.

### Concurrent Purchases

Stock reduction is performed atomically at checkout.

When multiple users attempt to purchase the last available units, only requests with sufficient remaining stock are allowed to succeed. Stock is never allowed to become negative.

### Redis Caching

Redis is used for product-list caching.

- Cache namespace: `products:<environment>:...`
- Cache TTL: 60 seconds
- Product listing responses are cached
- Product and stock changes invalidate the relevant cached product data
- The application can run without Redis configured, with product caching disabled

### Currency

The UI displays monetary values in **Indian Rupees (₹)**.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Zustand

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Redis

### Database

The application persists:

- Users
- Products
- Orders
- Order items
- Transactions
- Inventory history

## Project Structure

```text
inventory-ecommerce-system/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── store/
│       └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   └── test/
│       └── api.integration.test.js
│
└── README.md
```

## Getting Started

### Prerequisites

Make sure the following are available:

- Node.js
- MongoDB / MongoDB Atlas
- Redis instance
- Git

### Clone the repository

```bash
git clone https://github.com/Prathviesh1211/inventory-ecommerce-system.git
cd inventory-ecommerce-system
```

### Backend

```bash
cd server
npm install
```

Create the backend environment file using the project's environment example and provide the required MongoDB, JWT, Redis, and application configuration values.

Start the backend using the project's development command.

### Frontend

Open a second terminal:

```bash
cd client
npm install
```

Start the frontend using the project's development command.

The frontend communicates with the Express API through the configured backend URL.

## Testing

The backend includes integration tests covering important application behavior, including:

- Authentication
- Role-based access control
- Inventory updates
- Negative-stock protection
- Redis product caching
- Database-backed pricing
- Order ownership

Additional manual verification was performed for:

- Cart quantity updates
- Successful checkout
- Multi-product checkout
- Insufficient stock
- Out-of-stock products
- Disabled products
- Client-side price manipulation attempts
- Order ownership
- Order cancellation and inventory restoration
- Concurrent purchase attempts for the final available stock

Run the backend test suite from the `server` directory using the project's configured test command.

> Integration tests require the test environment to have access to the configured MongoDB database and Redis instance.

## Order Statuses

Orders move through the following supported statuses:

- Placed
- Processing
- Shipped
- Delivered
- Cancelled

Cancelling an order restores the purchased inventory and records the inventory change.

## Inventory Status

The application classifies inventory as:

- **In stock** — stock greater than 5
- **Low stock** — stock between 1 and 5
- **Out of stock** — stock equals 0

Out-of-stock products cannot be added to the cart.

## Security Considerations

The application includes basic security controls required for the assignment:

- Password hashing with bcrypt
- HTTP-only authentication cookies
- Backend authentication checks
- Backend role authorization
- Input validation
- Order ownership checks
- Server-side product price lookup
- Server-side stock validation
- Protection against negative inventory
- Sensitive configuration kept outside source control

## Sample Data

The application is set up to support the assignment's sample-data requirements, including:

- Admin account
- Multiple user accounts
- Multiple product categories
- In-stock products
- Low-stock products
- Out-of-stock products

## Assignment Scope

No real payment gateway is integrated, as payment processing was not required for this assignment.

Transaction records are maintained for order history and administrative visibility.

## Author

**Prathviesh Naik**

Built as a Full-Stack Developer take-home assignment for **Nissi Computing Labs LLP**.
