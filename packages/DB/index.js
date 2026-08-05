const path = require("path");
const dotenv = require("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

exports.PrismaClient = PrismaClient;
exports.prismaClient = new PrismaClient({ adapter });
