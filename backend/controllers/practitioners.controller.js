/**
 * Get list of practitioners
 */
function getPractitioners(req, res, next) {
  try {
    // Return hardcoded practitioner data
    const practitioners = [
      {
        "id": "685d2ada8385f0131d591f67",
        "name": "Malik Humza",
        "email": "1@email.com",
        "role": "practitioner",
        "phoneNumber": "+921111111111",
        "createdAt": "2025-06-26T11:11:22.184Z",
        "updatedAt": "2025-06-26T11:11:22.184Z"
      },
      {
        "id": "6876397d04420f9830b4a8c9",
        "name": "Haleema MoonSys",
        "email": "haleema@email.com",
        "role": "practitioner",
        "phoneNumber": "03014358102",
        "createdAt": "2025-07-15T11:20:29.936Z",
        "updatedAt": "2025-07-21T11:45:47.504Z"
      },
      {
        "id": "6888de0c5e9d132a9f2a3516",
        "name": "Tamoor Malik",
        "email": "tamoormalik088@gmail.com",
        "role": "practitioner",
        "phoneNumber": "03215799205",
        "createdAt": "2025-07-29T14:43:24.050Z",
        "updatedAt": "2025-07-29T14:43:24.050Z"
      }
    ];

    return res.status(200).json({
      message: 'Practitioners retrieved successfully',
      data: {
        totalPractitioners: practitioners.length,
        practitioners: practitioners
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching practitioners:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch practitioners";
    next(error);
  }
}

module.exports = {
  getPractitioners,
};

