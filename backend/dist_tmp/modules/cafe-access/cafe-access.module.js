"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CafeAccessModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const cafe_access_entity_1 = require("./entities/cafe-access.entity");
const cafe_access_service_1 = require("./cafe-access.service");
const cafe_access_controller_1 = require("./cafe-access.controller");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
let CafeAccessModule = class CafeAccessModule {
};
exports.CafeAccessModule = CafeAccessModule;
exports.CafeAccessModule = CafeAccessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cafe_access_entity_1.CafeAccess, event_entity_1.Event, booking_entity_1.Booking]),
            jwt_1.JwtModule.register({ secret: process.env.JWT_SECRET || 'ravi-secret-key' }),
        ],
        providers: [cafe_access_service_1.CafeAccessService],
        controllers: [cafe_access_controller_1.CafeAccessController],
        exports: [cafe_access_service_1.CafeAccessService],
    })
], CafeAccessModule);
