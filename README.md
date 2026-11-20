Gearly — Equipment Rental Platform (Client)
Gearly is an equipment rental marketplace that connects equipment owners with people who need tools and equipment for a specific period. Customers can discover listings, check availability, request rentals, and complete payments through Stripe Checkout. Equipment owners can manage their listings and rental activity, while administrators manage the platform.
<p align="center">
  <a href="https://gearly-equipment-client.vercel.app"><strong>Live Website</strong></a>
  ·
  <a href="https://gearly-equipment-server.vercel.app"><strong>Backend API</strong></a>
</p>Table of Contents
- Project Overview
- Live Links
- Core Features
- User Roles
- Booking and Payment Flow
- Technology Stack
- Getting Started
- Environment Configuration
- Available Scripts
- Project Structure
- Related Repository
Project Overview
Gearly makes it easier to rent equipment without purchasing it. Customers can browse equipment by category, search and filter listings, review rental details, and check date-by-date availability before submitting a booking request.

The frontend is built with the Next.js App Router and communicates with a separate Express.js backend. Authentication, role-aware access, booking validation, and payment verification are connected to the existing backend architecture.
Live Links
Resource	URL
Live Client Application	https://gearly-equipment-client.vercel.app
Backend API	https://gearly-equipment-server.vercel.app


Core Features
Public Marketplace
- Responsive landing page introducing the Gearly marketplace.
- Browse approved equipment listings.
- Explore equipment categories including construction, photography, vehicles and transportation, agriculture, electronics, and event equipment.
- Search equipment by relevant listing information such as equipment name or location.
- Filter and sort equipment using the available marketplace controls.
- View listing details, rental price, rental type, location, owner information, and equipment description.
Equipment Booking
- Booking form with rental start date, rental end date, quantity, contact number, delivery address, and optional notes.
- Monthly, quantity-aware availability calendar.
- Daily availability information such as the number of units remaining or a fully booked state.
- Date-range selection with visual availability feedback.
- Availability is checked again by the backend when a booking is submitted; the calendar is an early guide and is not the final booking authority.
- Rental duration and estimated rental amount are shown before submission.
Authentication and Role-Based Access
- Email-and-password authentication through the existing Better Auth integration.
- Google sign-in where configured.
- Customer, Owner, and Admin roles.
- Role-aware dashboard navigation and protected application areas.
- Profile management for authenticated users.
Customer Features
- View personal rental history and booking/payment statuses.
- Save equipment to Favorites and manage saved listings.
- Review equipment details and availability before booking.
- Continue through the Stripe-hosted checkout process for eligible bookings.
Owner Features
- Add and manage equipment listings.
- View equipment and rental activity associated with the signed-in owner.
- Review booking information and rental performance through the owner dashboard.
Admin Features
- Manage users and roles.
- Review and manage equipment listings and approval status.
- Monitor platform bookings and analytics.
User Roles
Role	Main capabilities
Customer	Browse equipment, manage favorites and profile, check availability, and book equipment.
Owner	Create and manage equipment listings and review rentals associated with their own equipment.
Admin	Manage users, equipment listings, bookings, and platform-level information.


Access to private data and actions is enforced by the backend. Hiding a button in the frontend is not treated as authorization.
Booking and Payment Flow
1. The customer opens an equipment listing and selects a rental period and quantity.
2. The calendar displays the available quantity for each date. The booking form also checks the selected date range.
3. The backend validates the requested dates, quantity, ownership context, and current availability when the booking is submitted.
4. An eligible booking proceeds to the backend-created Stripe Checkout session.
5. After checkout, the application asks the backend to verify the Checkout Session.
6. The booking is confirmed as paid only after successful server-side verification.
The backend remains the source of truth for availability and payment status. Do not treat a successful redirect to the client as proof of payment.
Technology Stack
Area	Technology
Framework	Next.js (App Router)
UI	React
Language	TypeScript
Authentication	Better Auth
Authorization	Role-based access with backend verification
Payments	Stripe Checkout (hosted checkout flow)
Deployment	Vercel


Core project packages include next, react, react-dom, typescript, and better-auth. The exact installed dependency list and versions are maintained in package.json and package-lock.json; use those files as the source of truth for the complete list.
Getting Started
Prerequisites
- Node.js and npm.
- Access to the Gearly backend API, either locally or through the deployed API URL.
- The environment configuration required by the existing authentication and API integration.
Installation
npm install
Configure Environment Variables
Create a local .env.local file using the variable names documented in the project's .env.example or existing deployment configuration.

The client configuration must point to the intended backend API and include the required public authentication/payment configuration. Only values explicitly designed to be public should use the NEXT_PUBLIC_ prefix. Never put MongoDB credentials, backend JWT-signing secrets, Stripe secret keys, or cron secrets in the client environment.

Do not commit .env.local or any file containing credentials.
Run the Development Server
npm run dev
Open http://localhost:3000 in your browser.
Production Build
npm run build
To run the production build locally, use the start script defined in package.json (commonly npm run start).
Available Scripts
The exact scripts are defined in package.json. Common project commands are:
Command	Purpose
npm run dev	Start the local Next.js development server.
npm run build	Create a production build.
npm run start	Serve the production build, if the script is defined.
npx tsc --noEmit	Run the TypeScript type check.


Project Structure
The frontend follows the existing Next.js App Router organization. The main areas are:
 equipment-client/
 ├── public/             # Static assets
 ├── src/
 │   ├── app/            # App Router pages, layouts, and route handlers
 │   ├── components/     # Shared and feature-specific UI components
 │   └── lib/            # Existing shared API and application integrations
 ├── .env.example        # Environment variable reference, when included
 ├── package.json        # Dependencies and npm scripts
 └── README.md
The actual repository may contain additional configuration and feature files; this is a high-level overview rather than a complete file listing.
Related Repository
The Express.js and MongoDB backend is maintained separately:
- Backend live URL: https://gearly-equipment-server.vercel.app
- Backend README: See the server repository's README.md for API, database, security, payment, and deployment details.
<p align="center"><strong>Gearly — The right equipment, for the right amount of time.</strong></p>