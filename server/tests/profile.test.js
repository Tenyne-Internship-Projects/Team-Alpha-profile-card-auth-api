/**
 * user.controller.new.test.js
 *
 * Run with:  npx jest user.controller.new.test.js
 *
 * NOTE ─ We re‑use the same mockResponse helper and the same Prisma mock style
 * you already had.  Simply drop this file next to your old test and
 * everything should pass.
 */

/* ────────────────────  GLOBAL MOCKS  ──────────────────── */
jest.mock("@prisma/client");
jest.mock("bcryptjs");
jest.mock("../utils/verifiedProfile", () => jest.fn());

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const isVerifiedProfile = require("../utils/verifiedProfile");

/* ────────────────────  CONTROLLER  ────────────────────── */
const {
  uploadFiles,
  updateAvatar,
  updateProfileWithFiles,
  toggleAvailability,
  getUserBadges,
  uploadBadge,
} = require("../controllers/user.controller");

/* ────────────────────  UTILITIES  ─────────────────────── */
const prisma = new PrismaClient();

const mockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

/* ────────────────────  𝗧𝗘𝗦𝗧𝗦  ───────────────────────── */
describe("NEW User‑controller endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    /* user table */
    prisma.user = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };

    /* profile table */
    prisma.profile = {
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    };

    /* generic bcrypt mock */
    bcrypt.hash = jest.fn((pw) => Promise.resolve("hashed_" + pw));
  });

  /* ────────────────  uploadFiles  ──────────────── */
  describe("uploadFiles", () => {
    const userId = "u1";

    it("updates avatar + docs when profile exists", async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: "p1", userId });
      prisma.profile.update.mockResolvedValue({
        id: "p1",
        avatarUrl: "/uploads/badges/avatar.png",
        documents: ["/uploads/badges/doc.pdf"],
      });

      const req = {
        params: { userId },
        files: {
          avatar: [{ filename: "avatar.png" }],
          documents: [{ filename: "doc.pdf" }],
        },
      };
      const res = mockResponse();

      await uploadFiles(req, res);

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          avatarUrl: "/uploads/badges/avatar.png",
          documents: { push: ["/uploads/badges/doc.pdf"] },
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when profile missing", async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      const req = { params: { userId }, files: {} };
      const res = mockResponse();

      await uploadFiles(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /* ────────────────  updateAvatar  ──────────────── */
  describe("updateAvatar", () => {
    it("sets base64 avatar for current user", async () => {
      const req = {
        user: { userId: "u1" },
        body: { avatarBase64: "data:image/png;base64,xyz==" },
      };
      prisma.user.update.mockResolvedValue({ id: "u1" });

      const res = mockResponse();
      await updateAvatar(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { avatar: "data:image/png;base64,xyz==" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  /* ────────────  updateProfileWithFiles  ──────────── */
  describe("updateProfileWithFiles", () => {
    it("updates basic fields + optional avatar/badge", async () => {
      const req = {
        user: { userId: "u1" },
        body: {
          fullName: "John",
          bio: "Dev",
          availability: "remote",
          avatarBase64: "avatar64",
          badgeBase64: "badge64",
        },
      };
      prisma.user.update.mockResolvedValue({ id: "u1" });

      const res = mockResponse();
      await updateProfileWithFiles(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: expect.objectContaining({
          fullName: "John",
          bio: "Dev",
          availability: "remote",
          avatar: "avatar64",
          badge: "badge64",
        }),
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  /* ────────────────  toggleAvailability  ──────────────── */
  describe("toggleAvailability", () => {
    const userId = "u1";

    it("updates availability when profile exists", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        profile: { id: "p1", isAvailable: false },
      });
      prisma.user.update.mockResolvedValue({
        profile: { isAvailable: true },
      });

      const req = { params: { userId }, body: { isAvailable: true } };
      const res = mockResponse();
      await toggleAvailability(req, res);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when user or profile missing", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = { params: { userId }, body: { isAvailable: true } };
      const res = mockResponse();

      await toggleAvailability(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /* ────────────────  getUserBadges  ──────────────── */
  describe("getUserBadges", () => {
    const userId = "u1";

    it("returns badges if verified", async () => {
      isVerifiedProfile.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({
        profile: { badges: ["b1.png", "b2.png"] },
      });

      const req = { params: { userId } };
      const res = mockResponse();
      await getUserBadges(req, res);

      expect(isVerifiedProfile).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ badges: ["b1.png", "b2.png"] });
    });

    it("blocks unverified users", async () => {
      isVerifiedProfile.mockResolvedValue(false);
      const req = { params: { userId } };
      const res = mockResponse();

      await getUserBadges(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  /* ────────────────  uploadBadge  ──────────────── */
  describe("uploadBadge", () => {
    const userId = "u1";

    it("appends badge for verified users", async () => {
      isVerifiedProfile.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({
        profile: { id: "p1", badges: ["old.png"] },
      });
      prisma.profile.update.mockResolvedValue({});

      const req = {
        params: { userId },
        file: { filename: "new.png" },
      };
      const res = mockResponse();

      await uploadBadge(req, res);

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { badges: ["old.png", "/uploads/badges/new.png"] },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("rejects unverified users", async () => {
      isVerifiedProfile.mockResolvedValue(false);

      const req = { params: { userId }, file: { filename: "new.png" } };
      const res = mockResponse();

      await uploadBadge(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
