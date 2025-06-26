const AppError = require("../utils/appError");
const logger = require("../utils/logger"); // Add your logger

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpiredError = () => new AppError("Your token has expired. Please log in again!", 401);

const sendErrorDev = (err, req, res) => {
    logger.error(`Error: ${err.message}`, { 
        statusCode: err.statusCode, 
        status: err.status,
        stack: err.stack 
    }); // Log only relevant error information
    if (req.originalUrl.startsWith("/api")) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        console.error("ERROR", err);
        res.status(err.statusCode).render("error", {
            title: "Something went wrong!",
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    logger.error(`Error: ${err.message}`, { 
        statusCode: err.statusCode, 
        status: err.status 
    }); // Log only relevant error information
    if (req.originalUrl.startsWith("/api")) {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            console.error("ERROR", err);
            res.status(500).json({
                status: "error",
                message: "Something went very wrong!",
            });
        }
    } else {
        if (err.isOperational) {
            res.status(err.statusCode).render("error", {
                title: "Something went wrong!",
                msg: err.message,
            });
        } else {
            console.error("ERROR", err);
            res.status(err.statusCode).render("error", {
                title: "Something went wrong!",
                msg: "Please try again later.",
            });
        }
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
        sendErrorDev(err, req, res);
    } else {
        let error = Object.assign(err);

        if (error.name === "CastError") {
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldDB(error);
        }
        if (error.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        }
        if (error.name === "JsonWebTokenError") {
            error = handleJWTError();
        }
        if (error.name === "TokenExpiredError") {
            error = handleJWTExpiredError();
        }

        sendErrorProd(error, req, res);
    }
};
