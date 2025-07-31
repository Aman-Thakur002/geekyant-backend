import { decodeToken } from "../utils/jwt";
const { Users, Roles } = require("../models");

export const setModule = (module) => {
  return function (req, res, next) {
    req.module = module ?? null;
    switch (req.method) {
      case "GET":
        req.permission = { module: module ? module + "-Read" : null };
        break;
      case "POST":
      case "PUT":
        req.permission = { module: module ? module + "-Write" : null };
        break;
      case "PATCH":
      case "DELETE":
        req.permission = { module: module ? module + "-All" : null };
        break;
      default:
        req.permission = { module: null };
        break;
    }
    next();
  };
};

// Simple authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token required",
      });
    }

    let payload;
    try {
      payload = decodeToken(token);
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    // Token expired
    if (payload.expiresIn < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      });
    }

    const user = await Users.findOne({
      _id: payload.id,
      status: "Active",
      isVerified: true,
      deletedAt: null
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Role-based access control
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.type)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    next();
  };
};

// Legacy middleware for backward compatibility
export const ensureAuth = (...allowedUserTypes) => {
  return async function (req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
    
      if (!authHeader) {
        return next();
      }

      if (!authHeader && allowedUserTypes.length !== 0) {
        return res.status(403).json({
          status: "error",
          message: "Not authorized",
        });
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      let payload;

      try {
        payload = decodeToken(token); 
      } catch (err) {
        return res.status(401).json({
          status: "error",
          message: "Invalid token",
        });
      }

      if (payload.expiresIn < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          status: "error",
          message: "Token expired",
        });
      }

      req.user = payload;

      if (!allowedUserTypes.includes(req.user.type)) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      const user = await Users.findOne({
        _id: payload.id,
        status: "Active",
        isVerified: true,
        deletedAt: null
      }).populate('role', 'name accessId');

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      req.user.hasAccess = () => true; // Simplified for engineering system

      next();
    } catch (err) {
      console.error("Middleware error:", err);
      return res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  };
};