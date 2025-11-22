// tests/weights.test.js

require("dotenv").config({ path: ".env.test" });
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const api = require("../api.js"); // uses exports.setApp(app, mongoose)

let app;

// Helper: register + login to get a JWT token string
async function registerAndLogin() {
  const registerBody = {
    firstName: "Test",
    lastName: "User",
    login: "testuser",
    email: "testuser@example.com",
    password: "password123",
  };

  // Register
  const regRes = await request(app).post("/api/register").send(registerBody);
  expect(regRes.statusCode).toBe(201);

  // Login
  const loginRes = await request(app)
    .post("/api/login")
    .send({ login: "testuser", password: "password123" });

  expect(loginRes.statusCode).toBe(200);
  expect(loginRes.body).toHaveProperty("jwtToken.jwtToken");

  return loginRes.body.jwtToken.jwtToken; // actual JWT string
}

beforeAll(async () => {
  const uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    throw new Error("MONGODB_URI_TEST is not set in .env.test");
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // JWT secret used by authenticate + /api/login
  process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || "test-secret";

  // Build Express app and wire your routes
  app = express();
  app.use(express.json());
  api.setApp(app, mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Clean DB between tests
afterEach(async () => {
  if (!mongoose.connection || !mongoose.connection.db) return;

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe("Weigh-in API", () => {
  test("rejects creating a weigh-in without auth", async () => {
    const res = await request(app).post("/api/weights").send({
      date: "2025-11-20",
      weight: 250,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  test("creates a weigh-in with valid token and body", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/weights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-11-20",
        weight: 250,
        note: "baseline",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("weighIn");
    expect(res.body.weighIn.weight).toBe(250);

    // Date should be the same calendar day we sent
    const iso = res.body.weighIn.date; // e.g. "2025-11-20T05:00:00.000Z"
    expect(iso.startsWith("2025-11-20")).toBe(true);
  });

  test("GET /api/weights/recent returns newest first and honors limit", async () => {
    const token = await registerAndLogin();

    // Create 12 entries with consecutive dates
    const dates = [
      "2025-11-01",
      "2025-11-02",
      "2025-11-03",
      "2025-11-04",
      "2025-11-05",
      "2025-11-06",
      "2025-11-07",
      "2025-11-08",
      "2025-11-09",
      "2025-11-10",
      "2025-11-11",
      "2025-11-12",
    ];

    for (let i = 0; i < dates.length; i++) {
      const createRes = await request(app)
        .post("/api/weights")
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: dates[i],
          weight: 200 + i,
        });

      expect(createRes.statusCode).toBe(201);
    }

    const res = await request(app)
      .get("/api/weights/recent?limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("entries");
    const entries = res.body.entries;

    // Should only have 10 entries
    expect(entries.length).toBe(10);

    // Newest date (2025-11-12) should be first
    const firstDate = entries[0].date.slice(0, 10);
    expect(firstDate).toBe("2025-11-12");

    // 10th newest (index 9) should be 2025-11-03
    const lastDate = entries[entries.length - 1].date.slice(0, 10);
    expect(lastDate).toBe("2025-11-03");
  });

  test("PUT /api/weights/:id updates weight", async () => {
    const token = await registerAndLogin();

    // Create a weigh-in
    const createRes = await request(app)
      .post("/api/weights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-11-20",
        weight: 260,
      });

    expect(createRes.statusCode).toBe(201);
    const id = createRes.body.weighIn._id;

    // Update the weight
    const updateRes = await request(app)
      .put(`/api/weights/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        weight: 259.4,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toHaveProperty("weighIn");
    expect(updateRes.body.weighIn.weight).toBe(259.4);
  });

  test("DELETE /api/weights/:id deletes the entry", async () => {
    const token = await registerAndLogin();

    // Create a weigh-in
    const createRes = await request(app)
      .post("/api/weights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-11-20",
        weight: 240,
      });

    expect(createRes.statusCode).toBe(201);
    const id = createRes.body.weighIn._id;

    // Delete it
    const deleteRes = await request(app)
      .delete(`/api/weights/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);

    // Confirm it no longer appears in /recent
    const res = await request(app)
      .get("/api/weights/recent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const ids = res.body.entries.map((e) => e._id);
    expect(ids).not.toContain(id);
  });

  test("fails with 400 when date or weight missing", async () => {
    const token = await registerAndLogin();

    // Missing weight
    const res1 = await request(app)
      .post("/api/weights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-11-20",
      });

    expect(res1.statusCode).toBe(400);
    expect(res1.body).toHaveProperty("error");

    // Missing date
    const res2 = await request(app)
      .post("/api/weights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        weight: 250,
      });

    expect(res2.statusCode).toBe(400);
    expect(res2.body).toHaveProperty("error");
  });
});
