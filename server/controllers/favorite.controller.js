const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Add a favorite
const addFavorite = async (req, res) => {
  const freelancerId = req.user.userId;
  const { projectId } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deleted || project.status !== "open") {
      return res
        .status(404)
        .json({ message: "Project not available to favorite" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        freelancerId,
        projectId,
      },
    });

    return res.status(201).json({
      message: "Project added to favorites",
      data: favorite,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Project already favorited" });
    }
    console.error("Add Favorite Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all favorites for freelancer
const getFavorites = async (req, res) => {
  const freelancerId = req.user.userId;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { freelancerId },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const validFavorites = favorites.filter(
      (fav) => fav.project && !fav.project.deleted
    );

    return res.status(200).json({ data: validFavorites });
  } catch (error) {
    console.error("Get Favorites Error:", error);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  }
};

// Remove a favorite
const removeFavorite = async (req, res) => {
  const freelancerId = req.user.userId;
  const { projectId } = req.params;

  try {
    await prisma.favorite.delete({
      where: {
        freelancerId_projectId: {
          freelancerId,
          projectId,
        },
      },
    });

    return res.status(200).json({ message: "Favorite removed" });
  } catch (error) {
    console.error("Remove Favorite Error:", error);
    return res.status(500).json({ message: "Failed to remove favorite" });
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
};
