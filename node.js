// index.js
require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// In-memory storage for demo bookings
let bookings = [];
let bookingCounter = 1;

// Setup middleware
app.use(express.json());
app.use(cors());

// For file uploads in guest booking form
const upload = multer({ dest: 'uploads/' });

// Endpoint to create a booking (guest booking form)
app.post('/api/bookings', upload.single('attachment'), (req, res) => {
  const { firstName, lastName, dob, email, phone, question, startTime, endTime } = req.body;
  const booking = {
    id: bookingCounter++,
    firstName,
    lastName,
    dob,
    email,
    phone,
    question,
    startTime,
    endTime,
    status: 'pending'  // pending until payment
  };
  bookings.push(booking);
  // Return the booking id for further processing
  res.json({ bookingId: booking.id });
});

// Endpoint to simulate payment processing
app.post('/api/payments', (req, res) => {
  const { bookingId } = req.body;
  // For demo, mark booking as confirmed
  const booking = bookings.find(b => b.id == bookingId);
  if(booking) {
    booking.status = 'confirmed';
    // Simulate Zoom link generation (in real use, call Zoom API)
    const zoomLink = "https://zoom.us/j/1234567890";
    booking.zoomLink = zoomLink;
    // Send email with Zoom link (using nodemailer)
    sendZoomEmail(booking.email, zoomLink)
      .then(() => res.json({ success: true }))
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Email sending failed' });
      });
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Endpoint to update a booking (modify booking)
app.put('/api/bookings/:id', upload.single('attachment'), (req, res) => {
  const bookingId = parseInt(req.params.id);
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    Object.assign(booking, req.body);
    res.json({ success: true, booking });
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Endpoint to delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = parseInt(req.params.id);
  bookings = bookings.filter(b => b.id !== bookingId);
  res.json({ success: true });
});

// Dummy endpoint to list bookings (for demo; normally requires authentication)
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// Function to send Zoom link email using Nodemailer
async function sendZoomEmail(recipient, zoomLink) {
  // Configure transporter (using Gmail for demo; in production, use proper credentials)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your Gmail address
      pass: process.env.EMAIL_PASS  // your Gmail password or App Password
    }
  });
  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: 'Your Therapy Session Zoom Link',
    text: `Thank you for booking your session. Here is your Zoom link: ${zoomLink}`
  };
  await transporter.sendMail(mailOptions);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
