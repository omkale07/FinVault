const request = require("supertest");

const app = require("../app");

describe("FinVault API", () => {

    test("GET / should return API status", async () => {

        const response = await request(app)
            .get("/");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            message: "FinVault API is running"
        });
    });

});