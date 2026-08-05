"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const jwtConfig = () => ({
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '24h',
    },
});
exports.jwtConfig = jwtConfig;
