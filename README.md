Rahul Kumar Das Website
This version is a working static website prototype.
Open `index.html` in a browser.
Open `admin.html` to manage the catalogue.
Working features
The public homepage displays books from the local catalogue.
The Books page has search and category filtering.
Each book has a detail page.
The Admin Dashboard can add, edit, delete, publish, hide and feature books.
You can manually change the title, price, category, description and cover image URL.
Changes are stored in the browser with localStorage and appear immediately on the public pages in that browser.
The checkout form records a demo order.
My Library displays demo purchases.
The Admin Dashboard displays demo orders and newsletter subscribers.
The catalogue can be exported as JSON.
Important before going live
This is a front end prototype. It does not yet provide real customer authentication, real payment verification or protected ebook downloads.
For live selling, connect a secure backend, authentication, a payment gateway such as Razorpay, protected ebook storage and server side payment verification. Only issue a protected download link after verified payment.
Do not place your paid PDF files in the public website folder if you want them protected.
How to deploy
The static portion can be uploaded to GitHub Pages, Netlify or Vercel. The live payment, customer account and secure ebook delivery functions should be connected to a backend before accepting payments.
