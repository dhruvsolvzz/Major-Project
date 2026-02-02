const request = require('supertest');
const app = require('../index'); // Assuming index.js is the entry point
const mongoose = require('mongoose');
const Donor = require('../models/Donor');

beforeAll(async () => {
  // Connect to the test database
  const url = 'mongodb://127.0.0.1/redbridge_test';
  await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Clean up the database and close the connection
  await Donor.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication Flows', () => {
  test('Register with phone and OTP', async () => {
    const response = await request(app)
      .post('/api/donors/send-signup-otp')
      .send({ phone: '1234567890', email: 'test@example.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('otp');

    const otp = response.body.otp;

    const registerResponse = await request(app)
      .post('/api/donors/register')
      .send({
        name: 'Test Donor',
        phone: '1234567890',
        email: 'test@example.com',
        password: 'password123',
        otp,
        address: 'Test Address',
        latitude: '0.0',
        longitude: '0.0'
      });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body).toHaveProperty('message', 'Donor registered successfully');
  });

  test('Login with Aadhaar', async () => {
    const response = await request(app)
      .post('/api/donors/login')
      .send({ aadhaar: '123412341234' });

    expect(response.statusCode).toBe(404); // Assuming Aadhaar is not registered
  });

  test('Forgot password flow', async () => {
    const otpResponse = await request(app)
      .post('/api/donors/forgot-password')
      .send({ phone: '1234567890' });

    expect(otpResponse.statusCode).toBe(200);
    expect(otpResponse.body).toHaveProperty('message', 'OTP sent to your phone number');

    const otp = otpResponse.body.otp;

    const resetResponse = await request(app)
      .post('/api/donors/forgot-password')
      .send({ phone: '1234567890', otp, newPassword: 'newpassword123' });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.body).toHaveProperty('message', 'Password reset successful');
  });
});