const { setPersonalInformation } = require("../services/firebase.service");
const { isFirebaseInitialized } = require("../config/firebase");

/**
 * Set/Update personal information for a user
 */
async function setPersonalInfo(req, res, next) {
  try {
    const { userId } = req.params;
    const personalInfo = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!personalInfo || Object.keys(personalInfo).length === 0) {
      return res.status(400).json({ 
        error: "Missing personalInfo",
        message: "Personal information data is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    await setPersonalInformation(userId, personalInfo);

    return res.status(200).json({
      message: "Personal information updated successfully",
      data: personalInfo,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error setting personal information:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to set personal information";
    next(error);
  }
}

module.exports = {
  setPersonalInfo,
};

