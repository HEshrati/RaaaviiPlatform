"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const facilitator_module_1 = require("./modules/facilitator/facilitator.module");
const venue_module_1 = require("./modules/venue/venue.module");
const journey_module_1 = require("./modules/journey/journey.module");
const hamravan_module_1 = require("./modules/hamravan/hamravan.module");
const rgci_module_1 = require("./modules/rgci/rgci.module");
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const payment_module_1 = require("./modules/payment/payment.module");
const schedule_1 = require("@nestjs/schedule");
const database_config_1 = __importDefault(require("./config/database.config"));
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const events_module_1 = require("./modules/events/events.module");
const profiles_module_1 = require("./modules/profiles/profiles.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const test_results_module_1 = require("./modules/test-results/test-results.module");
const games_module_1 = require("./modules/games/games.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const bale_bot_module_1 = require("./modules/bale-bot/bale-bot.module");
const admin_module_1 = require("./modules/admin/admin.module");
const payments_module_1 = require("./modules/payments/payments.module");
const upload_module_1 = require("./modules/upload/upload.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const support_module_1 = require("./modules/support/support.module");
const games_admin_controller_1 = require("./modules/test-admin/games-admin.controller");
const test_admin_controller_1 = require("./modules/test-admin/test-admin.controller");
const collaboration_module_1 = require("./modules/collaboration/collaboration.module");
const psychometric_module_1 = require("./modules/psychometric/psychometric.module");
const matching_module_1 = require("./modules/matching/matching.module");
const intelligence_module_1 = require("./modules/intelligence/intelligence.module");
const ai_content_module_1 = require("./modules/ai-content/ai-content.module");
const bot_module_1 = require("./modules/bot/bot.module");
const cafe_access_module_1 = require("./modules/cafe-access/cafe-access.module");
const roi_module_1 = require("./modules/roi/roi.module");
const sms_module_1 = require("./modules/sms/sms.module");
const crm_module_1 = require("./modules/crm/crm.module");
const my_therapist_module_1 = require("./modules/my-therapist/my-therapist.module");
const ai_chat_module_1 = require("./modules/ai-chat/ai-chat.module");
const ai_gateway_module_1 = require("./modules/ai-gateway/ai-gateway.module");
const behavior_tracking_interceptor_1 = require("./common/interceptors/behavior-tracking.interceptor");
const psychologist_verify_module_1 = require("./modules/psychologist-verify/psychologist-verify.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController, test_admin_controller_1.TestAdminController, games_admin_controller_1.GamesAdminController],
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cs) => ({
                    type: 'postgres',
                    host: cs.get('DB_HOST'),
                    port: cs.get('DB_PORT'),
                    username: cs.get('DB_USERNAME'),
                    password: cs.get('DB_PASSWORD'),
                    database: cs.get('DB_DATABASE'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: cs.get('NODE_ENV') !== 'production',
                    retryAttempts: 5,
                    retryDelay: 3000,
                    logging: cs.get('NODE_ENV') !== 'production',
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            payment_module_1.PaymentModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            bookings_module_1.BookingsModule,
            events_module_1.EventsModule,
            profiles_module_1.ProfilesModule,
            wallet_module_1.WalletModule,
            test_results_module_1.TestResultsModule,
            games_module_1.GamesModule,
            attendance_module_1.AttendanceModule,
            bale_bot_module_1.BaleBotModule,
            admin_module_1.AdminModule,
            payments_module_1.PaymentsModule,
            upload_module_1.UploadModule,
            notifications_module_1.NotificationsModule,
            support_module_1.SupportModule,
            collaboration_module_1.CollaborationModule,
            psychometric_module_1.PsychometricModule,
            matching_module_1.MatchingModule,
            intelligence_module_1.IntelligenceModule,
            ai_content_module_1.AiContentModule,
            bot_module_1.BotModule,
            ai_gateway_module_1.AiGatewayModule,
            cafe_access_module_1.CafeAccessModule,
            roi_module_1.RoiModule,
            sms_module_1.SmsModule,
            crm_module_1.CrmModule,
            my_therapist_module_1.MyTherapistModule,
            ai_chat_module_1.AiChatModule,
            psychologist_verify_module_1.PsychologistVerifyModule,
            rgci_module_1.RgciModule,
            hamravan_module_1.HamravanModule,
            journey_module_1.JourneyModule,
            facilitator_module_1.FacilitatorModule,
            venue_module_1.VenueModule,
        ],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: behavior_tracking_interceptor_1.BehaviorTrackingInterceptor,
            },
        ],
    })
], AppModule);
