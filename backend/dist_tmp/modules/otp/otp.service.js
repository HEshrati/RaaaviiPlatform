"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const otp_entity_1 = require("../../database/entities/otp.entity");
let OtpService = class OtpService {
    constructor(otpRepository) {
        this.otpRepository = otpRepository;
    }
    async getRecentByMobile(mobileNumber) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return await this.otpRepository.findOne({
            where: {
                mobileNumber,
                createdAt: (0, typeorm_2.MoreThan)(fiveMinutesAgo),
                isUsed: false,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async createOtp(mobileNumber, code) {
        const otp = this.otpRepository.create({
            mobileNumber,
            code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            isUsed: false,
        });
        return await this.otpRepository.save(otp);
    }
    async verifyOtp(mobileNumber, code) {
        const otp = await this.otpRepository.findOne({
            where: {
                mobileNumber,
                code,
                isUsed: false,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: {
                createdAt: 'DESC',
            },
        });
        if (!otp) {
            return false;
        }
        otp.isUsed = true;
        await this.otpRepository.save(otp);
        return true;
    }
    async resendOtp(mobileNumber) {
        const recentOtp = await this.getRecentByMobile(mobileNumber);
        if (recentOtp) {
            const timeLeft = Math.ceil((recentOtp.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000);
            throw new common_1.BadRequestException(`Please wait ${timeLeft} seconds before requesting new OTP`);
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await this.createOtp(mobileNumber, otpCode);
        return otpCode;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(otp_entity_1.OtpEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OtpService);
