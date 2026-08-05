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
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
/**
 * Webhook endpoints for N8N workflow integration
 * These endpoints receive callbacks from N8N workflows
 */
let WebhookController = class WebhookController {
    constructor() {
        this.sharedSecret = process.env.N8N_SHARED_SECRET || 'ravi-n8n-secret-2024';
    }
    verify(secret) {
        if (secret !== this.sharedSecret) {
            throw new common_1.UnauthorizedException('توکن نامعتبر است');
        }
    }
    /**
     * POST /api/webhooks/n8n
     * General N8N webhook for match completion notifications
     */
    async n8nWebhook(payload, secret) {
        this.verify(secret || '');
        return { success: true, received: true };
    }
    /**
     * POST /api/webhooks/n8n/store-vector
     * Store vector embeddings from AI enrichment workflow
     */
    async storeVector(payload, secret) {
        this.verify(secret || '');
        // TODO: Store in pgvector when available
        return { success: true, stored: true };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('n8n'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-n8n-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "n8nWebhook", null);
__decorate([
    (0, common_1.Post)('n8n/store-vector'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-n8n-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "storeVector", null);
exports.WebhookController = WebhookController = __decorate([
    (0, common_1.Controller)('webhooks')
], WebhookController);
