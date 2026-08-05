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
var BehaviorTrackingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviorTrackingInterceptor = void 0;
/**
 * BehaviorTrackingInterceptor
 * هر درخواست API را به صورت خودکار ثبت می‌کند
 * کافی است فقط یک بار در app.module.ts یا main.ts ثبت شود
 * مسیر: src/common/interceptors/behavior-tracking.interceptor.ts
 */
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const crm_service_1 = require("../../modules/crm/crm.service");
const user_behavior_event_entity_1 = require("../../modules/crm/entities/user-behavior-event.entity");
/** endpoint هایی که نباید ثبت شوند (برای جلوگیری از حلقه) */
const SKIP_PATHS = [
    '/api/crm/',
    '/api/health',
    '/uploads/',
    '/favicon',
];
let BehaviorTrackingInterceptor = BehaviorTrackingInterceptor_1 = class BehaviorTrackingInterceptor {
    constructor(crmService) {
        this.crmService = crmService;
        this.logger = new common_1.Logger(BehaviorTrackingInterceptor_1.name);
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const endpoint = req.url || '';
        // skip برای endpoint های خاص
        if (SKIP_PATHS.some(p => endpoint.includes(p))) {
            return next.handle();
        }
        const startTime = Date.now();
        const userId = req.user?.id ?? null;
        const sessionId = req.headers?.['x-session-id'] ?? req.cookies?.['session_id'] ?? null;
        const ipAddress = req.ip || req.headers?.['x-forwarded-for']?.split(',')[0] || '';
        const userAgent = req.headers?.['user-agent'] || '';
        const method = req.method;
        return next.handle().pipe((0, operators_1.tap)((responseBody) => {
            const responseTimeMs = Date.now() - startTime;
            const httpStatus = context.switchToHttp().getResponse().statusCode;
            // رویداد موفق
            this.crmService.track({
                userId,
                eventType: user_behavior_event_entity_1.BehaviorEventType.API_CALL,
                severity: httpStatus >= 400 ? user_behavior_event_entity_1.EventSeverity.ERROR : user_behavior_event_entity_1.EventSeverity.INFO,
                apiEndpoint: `${method} ${endpoint.split('?')[0]}`,
                httpStatus,
                responseTimeMs,
                sessionId,
                ipAddress,
                userAgent,
                metadata: {
                    query: req.query,
                    slow: responseTimeMs > 2000,
                },
            });
        }), (0, operators_1.catchError)((err) => {
            const responseTimeMs = Date.now() - startTime;
            const httpStatus = err.status || 500;
            // رویداد خطا
            this.crmService.track({
                userId,
                eventType: user_behavior_event_entity_1.BehaviorEventType.API_ERROR,
                severity: user_behavior_event_entity_1.EventSeverity.ERROR,
                apiEndpoint: `${method} ${endpoint.split('?')[0]}`,
                httpStatus,
                responseTimeMs,
                sessionId,
                ipAddress,
                userAgent,
                metadata: {
                    error: err.message,
                    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
                },
            });
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.BehaviorTrackingInterceptor = BehaviorTrackingInterceptor;
exports.BehaviorTrackingInterceptor = BehaviorTrackingInterceptor = BehaviorTrackingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], BehaviorTrackingInterceptor);
