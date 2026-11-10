const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        // 1. Get authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. Please login."
            });
        }

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 5. Store user information in request
        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        // 6. Continue to controller
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;