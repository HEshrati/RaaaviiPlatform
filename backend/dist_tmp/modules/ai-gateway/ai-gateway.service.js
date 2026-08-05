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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGatewayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AiGatewayService = class AiGatewayService {
    constructor(configService) {
        this.configService = configService;
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-sonnet-4-5-20250929';
        this.apiKey = this.configService.get('AI_API_KEY') || this.configService.get('ANTHROPIC_API_KEY') || '';
    }
    async chat(messages) {
        if (!this.apiKey) {
            throw new common_1.HttpException('کلید API تنظیم نشده است.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        const systemPrompt = `تو دستیار هوشمند اپلیکیشن راوی هستی.
راوی یک پلتفرم برای برگزاری همنشینی‌ها و رویدادهای اجتماعی در ایران است.
همیشه به فارسی پاسخ بده. لحن گرم، صمیمی و مفید داشته باش. پاسخ‌هایت را کوتاه و مفید نگه دار (حداکثر ۳-۴ جمله).`;
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: messages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`GapGPT API error: ${response.status}`, errorBody);
                throw new common_1.HttpException('خطا در اتصال به سرویس هوش مصنوعی.', common_1.HttpStatus.BAD_GATEWAY);
            }
            const data = await response.json();
            const reply = data?.content?.[0]?.text || data?.choices?.[0]?.message?.content || 'متأسفانه پاسخی دریافت نشد.';
            return { reply };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            console.error('AI Gateway unexpected error:', error);
            return { reply: 'سرویس هوش مصنوعی موقتاً در دسترس نیست.' };
        }
    }
};
exports.AiGatewayService = AiGatewayService;
exports.AiGatewayService = AiGatewayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiGatewayService);
