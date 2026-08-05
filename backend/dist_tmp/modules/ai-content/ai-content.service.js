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
var AiContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiContentService = void 0;
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const typeorm_3 = require("@nestjs/typeorm");
const typeorm_4 = require("typeorm");
const ai_content_entity_1 = require("./entities/ai-content.entity");
const AI_API_URL = (process.env.AI_BASE_URL || 'https://api.gapgpt.app/v1') + '/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o';
const ARTICLE_PLAN = [
    { topic: 'نظریه دلبستگی بالبی و تأثیر آن بر روابط بزرگسالان', group: 'دلبستگی', author: 'جان بالبی', angle: 'دیدگاه تکاملی-روانکاوانه', emoji: '🫂', category: 'attachment', tags: ['دلبستگی', 'بالبی', 'روابط'], unsplash_id: '1518199266791-2b2f7d62e072', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'سبک‌های دلبستگی اینسورث و الگوهای رفتاری در رابطه', group: 'دلبستگی', author: 'مری اینسورث', angle: 'آزمایشگاهی-رفتاری', emoji: '🫂', category: 'attachment', tags: ['دلبستگی', 'اینسورث', 'سبک رفتاری'], unsplash_id: '1518199266791-2b2f7d62e072', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'دلبستگی رمانتیک از نوزادی تا عاشقانه — هازان و شیور', group: 'دلبستگی', author: 'سینتیا هازان و فیلیپ شیور', angle: 'روانشناسی اجتماعی', emoji: '🫂', category: 'attachment', tags: ['دلبستگی رمانتیک', 'هازان'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'بهداشت روان'] },
    { topic: 'مدل پردازش مودال تنظیم هیجان جیمز گروس', group: 'تنظیم هیجانی', author: 'جیمز گروس', angle: 'شناختی-رفتاری', emoji: '💭', category: 'emotion', tags: ['تنظیم هیجان', 'گروس', 'بازارزیابی'], unsplash_id: '1506905925346-21bda4d32df4', recommendedFor: ['هوش هیجانی', 'مدیریت استرس'] },
    { topic: 'DBT لیندهان — تنظیم هیجان در رابطه', group: 'تنظیم هیجانی', author: 'مارشا لیندهان', angle: 'DBT و ذهن‌آگاهی', emoji: '💭', category: 'emotion', tags: ['DBT', 'لیندهان', 'ذهن‌آگاهی'], unsplash_id: '1506126613408-eca07ce68773', recommendedFor: ['بهداشت روان', 'ذهن‌آگاهی'] },
    { topic: 'مدل ACT هایز در مدیریت هیجانات', group: 'تنظیم هیجانی', author: 'استیون هایز', angle: 'ACT و انعطاف‌پذیری روانی', emoji: '💭', category: 'emotion', tags: ['ACT', 'هایز', 'پذیرش'], unsplash_id: '1507003211169-0a1dd7228f2d', recommendedFor: ['هوش هیجانی', 'رشد فردی'] },
    { topic: 'همدلی از دیدگاه کارل راجرز', group: 'همدلی', author: 'کارل راجرز', angle: 'انسان‌گرایانه', emoji: '❤️', category: 'communication', tags: ['همدلی', 'راجرز', 'رابطه'], unsplash_id: '1571019613454-1cb2f99b2d8b', recommendedFor: ['روابط سالم', 'هوش هیجانی'] },
    { topic: 'نوروعلم همدلی — نورون‌های آینه‌ای دسیتی', group: 'همدلی', author: 'ژان دسیتی', angle: 'نوروعلمی', emoji: '❤️', category: 'emotion', tags: ['نورون آینه‌ای', 'دسیتی', 'نوروعلم'], unsplash_id: '1507003211169-0a1dd7228f2d', recommendedFor: ['هوش هیجانی', 'بهداشت روان'] },
    { topic: 'همدلی شناختی و عاطفی — مدل آیزنبرگ', group: 'همدلی', author: 'نانسی آیزنبرگ', angle: 'رشدی-اجتماعی', emoji: '❤️', category: 'social', tags: ['همدلی شناختی', 'آیزنبرگ'], unsplash_id: '1521737852567-6949f3f9f2b5', recommendedFor: ['روابط سالم', 'رشد فردی'] },
    { topic: 'ارتباط غیرخشونت‌آمیز NVC رزنبرگ', group: 'ارتباط موثر', author: 'مارشال رزنبرگ', angle: 'NVC و نیازهای انسانی', emoji: '🗣️', category: 'communication', tags: ['NVC', 'رزنبرگ', 'ارتباط'], unsplash_id: '1521737852567-6949f3f9f2b5', recommendedFor: ['روابط سالم', 'رشد فردی'] },
    { topic: 'اصول گاتمن برای ارتباط موثر زوج‌ها', group: 'ارتباط موثر', author: 'جان گاتمن', angle: 'تحقیقات طولی زوج‌درمانی', emoji: '🗣️', category: 'relationship', tags: ['گاتمن', 'زوج‌درمانی', 'ارتباط'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'پنج زبان عشق گری چاپمن', group: 'ارتباط موثر', author: 'گری چاپمن', angle: 'رفتاری-ارتباطی', emoji: '🗣️', category: 'relationship', tags: ['زبان عشق', 'چاپمن', 'محبت'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'مدل شناختی اضطراب اجتماعی کلارک و ولز', group: 'اضطراب اجتماعی', author: 'دیوید کلارک و آدریان ولز', angle: 'CBT', emoji: '😰', category: 'psychology', tags: ['اضطراب اجتماعی', 'کلارک', 'CBT'], unsplash_id: '1494368308039-ed3393a402a4', recommendedFor: ['مدیریت استرس', 'بهداشت روان'] },
    { topic: 'CBT هایمبرگ برای فوبی اجتماعی', group: 'اضطراب اجتماعی', author: 'ریچارد هایمبرگ', angle: 'مواجهه درمانی', emoji: '😰', category: 'psychology', tags: ['فوبی اجتماعی', 'هایمبرگ', 'مواجهه'], unsplash_id: '1494368308039-ed3393a402a4', recommendedFor: ['مدیریت استرس', 'رشد فردی'] },
    { topic: 'ACT و ذهن‌آگاهی در کاهش اضطراب اجتماعی', group: 'اضطراب اجتماعی', author: 'استیون هایز', angle: 'پذیرش و ارزش‌ها', emoji: '😰', category: 'psychology', tags: ['ACT', 'اضطراب اجتماعی', 'پذیرش'], unsplash_id: '1506126613408-eca07ce68773', recommendedFor: ['مدیریت استرس', 'ذهن‌آگاهی'] },
    { topic: 'MBSR کابات‌زین — کاهش استرس مبتنی بر ذهن‌آگاهی', group: 'ذهن‌آگاهی', author: 'جان کابات‌زین', angle: 'پزشکی-بالینی', emoji: '🧘', category: 'psychology', tags: ['MBSR', 'کابات‌زین', 'ذهن‌آگاهی'], unsplash_id: '1506126613408-eca07ce68773', recommendedFor: ['مدیریت استرس', 'ذهن‌آگاهی'] },
    { topic: 'MBCT سیگال — درمان افسردگی با ذهن‌آگاهی', group: 'ذهن‌آگاهی', author: 'زیندل سیگال', angle: 'جلوگیری از عود', emoji: '🧘', category: 'psychology', tags: ['MBCT', 'سیگال', 'افسردگی'], unsplash_id: '1506126613408-eca07ce68773', recommendedFor: ['بهداشت روان', 'ذهن‌آگاهی'] },
    { topic: 'شفقت به خود کریستین نف در روابط', group: 'ذهن‌آگاهی', author: 'کریستین نف', angle: 'شفقت به خود', emoji: '🧘', category: 'relationship', tags: ['شفقت به خود', 'نف', 'ذهن‌آگاهی'], unsplash_id: '1508672019048-58f569e17de3', recommendedFor: ['ذهن‌آگاهی', 'روابط سالم'] },
    { topic: 'EFT جانسون — درمان هیجان‌محور زوج‌ها', group: 'روابط سالم', author: 'سو جانسون', angle: 'EFT و دلبستگی', emoji: '💞', category: 'relationship', tags: ['EFT', 'جانسون', 'زوج‌درمانی'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'مثلث عشق اشترنبرگ — صمیمیت، شور و تعهد', group: 'روابط سالم', author: 'رابرت اشترنبرگ', angle: 'روانشناسی شناختی عشق', emoji: '💞', category: 'relationship', tags: ['مثلث عشق', 'اشترنبرگ', 'تعهد'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'مرزهای سالم در رابطه — نظریه لرنر', group: 'روابط سالم', author: 'هنریت لرنر', angle: 'رشدی-ارتباطی', emoji: '💞', category: 'relationship', tags: ['مرزهای سالم', 'لرنر', 'رابطه'], unsplash_id: '1511988617509-a57c8a288659', recommendedFor: ['روابط سالم', 'رشد فردی'] },
    { topic: 'هوش هیجانی گلمن — چهار حوزه و موفقیت', group: 'هوش هیجانی', author: 'دانیل گلمن', angle: 'کاربردی-سازمانی', emoji: '🧠', category: 'emotion', tags: ['هوش هیجانی', 'گلمن', 'موفقیت'], unsplash_id: '1507003211169-0a1dd7228f2d', recommendedFor: ['هوش هیجانی', 'رشد فردی'] },
    { topic: 'مدل سالووی-مایر — هوش هیجانی به‌مثابه توانایی', group: 'هوش هیجانی', author: 'پیتر سالووی و جان مایر', angle: 'توانایی شناختی', emoji: '🧠', category: 'emotion', tags: ['سالووی', 'مایر', 'هوش هیجانی'], unsplash_id: '1507003211169-0a1dd7228f2d', recommendedFor: ['هوش هیجانی', 'بهداشت روان'] },
    { topic: 'مدل بار-اون — هوش اجتماعی-هیجانی و بهزیستی', group: 'هوش هیجانی', author: 'رووان بار-اون', angle: 'بهزیستی روانشناختی', emoji: '🧠', category: 'emotion', tags: ['بار-اون', 'EQ-i', 'بهزیستی'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['هوش هیجانی', 'روانشناسی مثبت'] },
    { topic: 'سلسله‌مراتب نیازهای مازلو و خودشکوفایی', group: 'خودشناسی', author: 'آبراهام مازلو', angle: 'انسان‌گرایانه-انگیزشی', emoji: '🌱', category: 'psychology', tags: ['مازلو', 'نیازها', 'خودشکوفایی'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['خودشناسی', 'رشد فردی'] },
    { topic: 'خودپنداره راجرز — فاصله بین خود واقعی و ایده‌آل', group: 'خودشناسی', author: 'کارل راجرز', angle: 'درمان متمرکز بر مراجع', emoji: '🌱', category: 'psychology', tags: ['خودپنداره', 'راجرز', 'هویت'], unsplash_id: '1520813792240-56fc4a3765a7', recommendedFor: ['خودشناسی', 'رشد فردی'] },
    { topic: 'فردیت‌یابی یونگ — مسیر خود کامل', group: 'خودشناسی', author: 'کارل گوستاو یونگ', angle: 'روانشناسی تحلیلی', emoji: '🌱', category: 'psychology', tags: ['یونگ', 'فردیت', 'ناخودآگاه'], unsplash_id: '1520813792240-56fc4a3765a7', recommendedFor: ['خودشناسی', 'بهداشت روان'] },
    { topic: 'رشد پس از تروما — تدسکی و کالهون', group: 'رشد پس از تروما', author: 'ریچارد تدسکی', angle: 'روانشناسی مثبت-بالینی', emoji: '🦋', category: 'psychology', tags: ['رشد پس از تروما', 'تدسکی', 'معنا'], unsplash_id: '1495592822108-9e6261896da8', recommendedFor: ['بهداشت روان', 'روانشناسی مثبت'] },
    { topic: 'مدل هرمان برای بهبودی از تروما', group: 'رشد پس از تروما', author: 'جودیت هرمان', angle: 'فمینیستی-بالینی', emoji: '🦋', category: 'psychology', tags: ['هرمان', 'PTSD', 'بهبودی'], unsplash_id: '1495592822108-9e6261896da8', recommendedFor: ['بهداشت روان', 'روابط سالم'] },
    { topic: 'جسم ناگفته ون‌درکولک — تروما در بدن', group: 'رشد پس از تروما', author: 'بسل ون‌درکولک', angle: 'نوروبیولوژیک-بدنی', emoji: '🦋', category: 'psychology', tags: ['ون‌درکولک', 'تروما', 'بدن'], unsplash_id: '1495592822108-9e6261896da8', recommendedFor: ['بهداشت روان', 'مدیریت استرس'] },
    { topic: 'درون‌گرایی از دیدگاه یونگ', group: 'درون‌گرایی', author: 'کارل گوستاو یونگ', angle: 'تحلیلی-شخصیتی', emoji: '🌙', category: 'social', tags: ['درون‌گرا', 'یونگ', 'انرژی'], unsplash_id: '1474631245212-d31563ff0', recommendedFor: ['خودشناسی', 'رشد فردی'] },
    { topic: 'قدرت درون‌گراها — سوزان کین', group: 'درون‌گرایی', author: 'سوزان کین', angle: 'فرهنگی-اجتماعی', emoji: '🌙', category: 'social', tags: ['درون‌گرایی', 'کین', 'قدرت'], unsplash_id: '1474631245212-d31563ff0', recommendedFor: ['خودشناسی', 'روانشناسی مثبت'] },
    { topic: 'شخصیت حساس بلندپردازانه — ایلین آرون و HSP', group: 'درون‌گرایی', author: 'ایلین آرون', angle: 'عصبی-رشدی', emoji: '🌙', category: 'social', tags: ['HSP', 'آرون', 'حساسیت بالا'], unsplash_id: '1474631245212-d31563ff0', recommendedFor: ['خودشناسی', 'بهداشت روان'] },
    { topic: 'علم تنهایی — کاچیوپو', group: 'تنهایی', author: 'جان کاچیوپو', angle: 'نوروعلمی-اجتماعی', emoji: '🌠', category: 'social', tags: ['تنهایی', 'کاچیوپو', 'ارتباط'], unsplash_id: '1468027050942-fb61f4de6e41', recommendedFor: ['بهداشت روان', 'روابط سالم'] },
    { topic: 'تنهایی وجودی یالوم', group: 'تنهایی', author: 'اروین یالوم', angle: 'اگزیستانسیال', emoji: '🌠', category: 'psychology', tags: ['یالوم', 'تنهایی', 'اگزیستانسیال'], unsplash_id: '1468027050942-fb61f4de6e41', recommendedFor: ['خودشناسی', 'بهداشت روان'] },
    { topic: 'از تنهایی به تنها بودن — اریش فروم', group: 'تنهایی', author: 'اریش فروم', angle: 'جامعه‌شناختی-فلسفی', emoji: '🌠', category: 'psychology', tags: ['فروم', 'تنهایی', 'آزادی'], unsplash_id: '1468027050942-fb61f4de6e41', recommendedFor: ['خودشناسی', 'رشد فردی'] },
    { topic: 'شفقت به خود نف — سه مولفه و تمرین', group: 'خودمراقبتی', author: 'کریستین نف', angle: 'ذهن‌آگاهی-مثبت', emoji: '🌸', category: 'psychology', tags: ['شفقت به خود', 'نف', 'مراقبت'], unsplash_id: '1508672019048-58f569e17de3', recommendedFor: ['روانشناسی مثبت', 'مدیریت استرس'] },
    { topic: 'مدل PERMA سلیگمن — بهزیستی روانشناختی', group: 'خودمراقبتی', author: 'مارتین سلیگمن', angle: 'روانشناسی مثبت', emoji: '🌸', category: 'psychology', tags: ['PERMA', 'سلیگمن', 'بهزیستی'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['روانشناسی مثبت', 'رشد فردی'] },
    { topic: 'نظریه خودتعیین‌گری دسی و رایان', group: 'خودمراقبتی', author: 'ادوارد دسی و ریچارد رایان', angle: 'انگیزشی-خودمختاری', emoji: '🌸', category: 'psychology', tags: ['خودتعیین‌گری', 'دسی', 'رایان', 'انگیزه'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['رشد فردی', 'روانشناسی مثبت'] },
    { topic: 'صمیمیت عاطفی — یالوم', group: 'صمیمیت', author: 'اروین یالوم', angle: 'اگزیستانسیال', emoji: '🌺', category: 'relationship', tags: ['صمیمیت', 'یالوم', 'عاطفه'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'نقش اکسی‌توسین در پیوند عاطفی', group: 'صمیمیت', author: 'سو کارتر', angle: 'نوروبیولوژیک', emoji: '🌺', category: 'emotion', tags: ['اکسی‌توسین', 'پیوند', 'عشق'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'هوش هیجانی'] },
    { topic: 'صمیمیت جنسی سالم در رابطه پایدار', group: 'صمیمیت', author: 'Emily Nagoski', angle: 'بالینی-جنسی', emoji: '🌺', category: 'relationship', tags: ['صمیمیت جنسی', 'سلامت جنسی', 'رابطه'], unsplash_id: '1529156069898-49953e39b3ac', recommendedFor: ['روابط سالم', 'بهداشت روان'] },
    { topic: 'هشت مرحله رشد هویت اریکسون', group: 'هویت', author: 'اریک اریکسون', angle: 'رشدی-تاریخی', emoji: '🔮', category: 'psychology', tags: ['اریکسون', 'هویت', 'مراحل رشد'], unsplash_id: '1520813792240-56fc4a3765a7', recommendedFor: ['خودشناسی', 'رشد فردی'] },
    { topic: 'Big Five — مدل پنج عاملی شخصیت در روابط', group: 'هویت', author: 'کاستا و مک‌ری', angle: 'تجربی-روانسنجی', emoji: '🔮', category: 'psychology', tags: ['Big Five', 'شخصیت', 'NEO'], unsplash_id: '1520813792240-56fc4a3765a7', recommendedFor: ['خودشناسی', 'روابط سالم'] },
    { topic: 'سیستم‌های خانوادگی بوون — هویت در خانواده', group: 'هویت', author: 'موری بوون', angle: 'سیستمی-خانوادگی', emoji: '🔮', category: 'psychology', tags: ['بوون', 'سیستم خانوادگی', 'هویت'], unsplash_id: '1520813792240-56fc4a3765a7', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'جریان (Flow) چیکسنتمیهالی — تجربه بهینه', group: 'روانشناسی مثبت', author: 'میهالی چیکسنتمیهالی', angle: 'تجربه بهینه', emoji: '✨', category: 'psychology', tags: ['جریان', 'فلو', 'چیکسنتمیهالی'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['روانشناسی مثبت', 'رشد فردی'] },
    { topic: 'علم قدردانی و شادی — لیوبومیرسکی', group: 'روانشناسی مثبت', author: 'سونیا لیوبومیرسکی', angle: 'تجربی-مثبت', emoji: '✨', category: 'psychology', tags: ['قدردانی', 'شادی', 'لیوبومیرسکی'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['روانشناسی مثبت', 'مدیریت استرس'] },
    { topic: 'نظریه امید اسنایدر — انعطاف‌پذیری در عمل', group: 'روانشناسی مثبت', author: 'چارلز اسنایدر', angle: 'شناختی-مثبت', emoji: '✨', category: 'psychology', tags: ['امید', 'انعطاف‌پذیری', 'اسنایدر'], unsplash_id: '1519834785169-98a25099c6e9', recommendedFor: ['روانشناسی مثبت', 'رشد فردی'] },
    { topic: 'مرزهای روانشناختی — بیتی از هم‌وابستگی تا آزادی', group: 'مرزها', author: 'ملودی بیتی', angle: 'بازتوانی-رابطه‌ای', emoji: '🛡️', category: 'psychology', tags: ['مرز', 'هم‌وابستگی', 'بیتی'], unsplash_id: '1511988617509-a57c8a288659', recommendedFor: ['روابط سالم', 'خودشناسی'] },
    { topic: 'شجاعت آسیب‌پذیری براون — نه گفتن سالم', group: 'مرزها', author: 'برنه براون', angle: 'آسیب‌پذیری-شجاعت', emoji: '🛡️', category: 'communication', tags: ['مرز', 'براون', 'آسیب‌پذیری'], unsplash_id: '1511988617509-a57c8a288659', recommendedFor: ['رشد فردی', 'روابط سالم'] },
    { topic: 'هویت مستقل در رابطه — تمایز و قرابت', group: 'مرزها', author: 'دیوید اشنایرمن', angle: 'تمایز و قرابت', emoji: '🛡️', category: 'relationship', tags: ['استقلال', 'رابطه', 'هویت'], unsplash_id: '1511988617509-a57c8a288659', recommendedFor: ['روابط سالم', 'خودشناسی'] },
];
let AiContentService = AiContentService_1 = class AiContentService {
    constructor(contentRepo, dataSource) {
        this.contentRepo = contentRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(AiContentService_1.name);
    }
    async dailyArticleGeneration() {
        this.logger.log('Daily article generation started - FORCED MODE');
        const API_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
        const TOPICS = [
            { topic: 'خودآگاهی و شناخت خود', cat: 'خودشناسی', ref: 'کارل یونگ' },
            { topic: 'مدیریت اضطراب روزانه', cat: 'مدیریت استرس', ref: 'آرون بک' },
            { topic: 'روابط سالم عاطفی', cat: 'روابط سالم', ref: 'جان گاتمن' },
            { topic: 'هوش هیجانی در کار', cat: 'هوش هیجانی', ref: 'دانیل گلمن' },
            { topic: 'ذهن‌آگاهی و آرامش', cat: 'ذهن‌آگاهی', ref: 'جان کابات‌زین' },
            { topic: 'رشد شخصی و انگیزه', cat: 'رشد فردی', ref: 'مارتین سلیگمن' },
            { topic: 'سبک دلبستگی در روابط', cat: 'روابط سالم', ref: 'جان بالبی' },
            { topic: 'افسردگی و راهکارها', cat: 'بهداشت روان', ref: 'آرون بک' },
            { topic: 'شادکامی واقعی چیست', cat: 'روانشناسی مثبت', ref: 'مارتین سلیگمن' },
            { topic: 'تنظیم هیجانات منفی', cat: 'هوش هیجانی', ref: 'جیمز گروس' },
        ];
        // ۲ مقاله در روز — موضوع براساس روز هفته
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const topics = [TOPICS[dayOfYear % TOPICS.length], TOPICS[(dayOfYear + 1) % TOPICS.length]];
        for (const { topic, cat, ref } of topics) {
            try {
                // اسلاگ یونیک با Timestamp تا تحت هیچ شرایطی تکراری در نظر گرفته نشود
                const slug = `daily-${topic.replace(/\s+/g, '-').slice(0, 30)}-${Date.now()}`;
                let body = '';
                let summary = `مقاله روزانه درباره ${topic}`;
                // حتی اگر API Key نبود یا هوش مصنوعی قطع بود، مقاله با متن پیش‌فرض ساخته شود
                if (API_KEY) {
                    try {
                        const resp = await fetch('https://api.gapgpt.app/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                max_tokens: 3500,
                                messages: [{ role: 'user', content: `Write a comprehensive psychology article in PERSIAN (Farsi).
Topic: ${topic}
Reference: ${ref}
REQUIREMENT: exactly 1200 Persian words minimum.
Structure (3 paragraphs each):
## مقدمه
## مفهوم اصلی
## پشتوانه علمی
## کاربرد در زندگی
## ۵ تکنیک عملی
## نتیجه‌گیری
Write in Persian directly:` }]
                            })
                        });
                        const data = await resp.json();
                        body = data.choices?.[0]?.message?.content || '';
                    }
                    catch (fetchErr) {
                        this.logger.warn(`AI Fetch failed for ${topic}: ${fetchErr.message}. Will use placeholder.`);
                    }
                }
                // اگر هوش مصنوعی متنی تولید نکرد یا ارور داد، یک ساختار پیش‌فرض می‌سازیم تا مقاله تحت هر شرایطی ساخته شود
                if (!body || body.trim().length < 50) {
                    body = `## مقدمه\n\nمقاله‌ای درباره ${topic} از دیدگاه ${ref}. این بخش به زودی تکمیل خواهد شد.\n\n## مفهوم اصلی\n\nتوضیحات مفهوم ${topic}.\n\n## کاربرد در زندگی\n\nکاربردهای عملی.\n\n## نتیجه‌گیری\n\nجمع‌بندی موضوع.`;
                    summary = `(پیش‌نویس اولیه) ${summary}`;
                }
                const emMap = { روابط_سالم: '💞', 'بهداشت روان': '🌿', 'هوش هیجانی': '💡', 'رشد فردی': '🚀', 'مدیریت استرس': '🧘', 'ذهن‌آگاهی': '🌸', 'روانشناسی مثبت': '✨', 'خودشناسی': '🔍' };
                const clMap = { 'روابط سالم': '#f97316', 'بهداشت روان': '#22c55e', 'هوش هیجانی': '#0ea5e9', 'رشد فردی': '#ec4899', 'مدیریت استرس': '#FF6B00', 'ذهن‌آگاهی': '#10b981', 'روانشناسی مثبت': '#a855f7', 'خودشناسی': '#eab308' };
                await this.dataSource.query(`
          INSERT INTO articles(title,slug,summary,content,category,author,read_time,image_url,is_published)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)
          ON CONFLICT(slug) DO NOTHING
        `, [topic, slug, summary, body, cat, ref,
                    Math.max(5, Math.min(25, Math.floor(body.split(' ').length / 200))),
                    `https://loremflickr.com/800/400/${encodeURIComponent(cat)},psychology?lock=${Math.abs(slug.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 500}`]);
                this.logger.log(`✅ Daily article FORCED CREATION success: ${topic}`);
            }
            catch (e) {
                this.logger.error(`❌ Daily article hard error: ${e.message}`);
            }
        }
    }
    async generateBulk50() {
        let created = 0, skipped = 0, errors = 0;
        this.logger.log('Starting bulk 50 generation');
        for (const plan of ARTICLE_PLAN) {
            try {
                const exists = await this.contentRepo.findOne({ where: { topic_group: plan.group, reference_author: plan.author } });
                if (exists) {
                    skipped++;
                    continue;
                }
                const art = await this.generateFromPlan(plan);
                if (art)
                    created++;
                await new Promise(r => setTimeout(r, 2000));
            }
            catch (e) {
                this.logger.error(`Bulk error: ${e.message}`);
                errors++;
            }
        }
        return { created, skipped, errors };
    }
    async generateFromPlan(plan) {
        const content = await this.callAIForArticle(plan);
        if (!content)
            return null;
        const wordCount = content.body.split(/\s+/).length;
        const slug = this.makeSlug(content.title);
        const slugExists = await this.contentRepo.findOne({ where: { slug } });
        const imageUrl = `https://loremflickr.com/800/400/${encodeURIComponent(plan.angle || plan.group || "psychology")}`;
        const article = this.contentRepo.create({
            title: content.title, content: content.body, summary: content.summary,
            tags: content.tags, status: ai_content_entity_1.ContentStatus.PUBLISHED,
            source_reference: `${plan.author} — ${plan.angle}`,
            topic_group: plan.group, reference_author: plan.author,
            emoji: plan.emoji, image_url: imageUrl, unsplash_query: plan.angle,
            word_count: wordCount, read_time_minutes: Math.ceil(wordCount / 200),
            slug: slugExists ? `${slug}-${Date.now()}` : slug,
            meta_description: content.summary?.slice(0, 160),
            recommended_for: plan.recommendedFor, published_at: new Date(),
        });
        return this.contentRepo.save(article);
    }
    async getUnderrepresentedTopics() {
        const rows = await this.dataSource.query("SELECT topic_group, reference_author FROM ai_content WHERE status='published' AND topic_group IS NOT NULL").catch(() => []);
        const done = new Set(rows.map((r) => `${r.topic_group}|||${r.reference_author}`));
        return ARTICLE_PLAN.filter(p => !done.has(`${p.group}|||${p.author}`));
    }
    async callAIForArticle(plan) {
        if (!AI_API_KEY) {
            return { title: `${plan.topic}`, summary: `بررسی ${plan.topic} از دیدگاه ${plan.author}`, body: this.placeholder(plan), tags: plan.tags };
        }
        const prompt = `تو یک روانشناس متخصص ایرانی هستی که مقالات علمی-کاربردی فارسی می‌نویسی.

موضوع: ${plan.topic}
رویکرد اصلی: ${plan.author} — ${plan.angle}
گروه: ${plan.group}

قوانین:
1. حداقل ۱۵۰۰ کلمه
2. علمی اما قابل فهم برای مخاطب ایرانی
3. مثال‌های واقعی ایرانی
4. ساختار با ## برای بخش‌ها
5. منحصربه‌فرد و غیرتکراری
6. هر بخش حداقل ۲ پاراگراف

فقط JSON خالص (بدون backtick):
{"title":"عنوان جذاب فارسی","summary":"خلاصه ۲-۳ جمله","tags":["تگ۱","تگ۲","تگ۳"],"body":"متن کامل"}`;
        try {
            const res = await fetch(AI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
                body: JSON.stringify({ model: AI_MODEL, max_tokens: 4096, messages: [{ role: 'user', content: prompt }], temperature: 0.75 }),
            });
            if (!res.ok) {
                this.logger.warn(`AI ${res.status}`);
                return null;
            }
            const data = await res.json();
            const raw = (data.choices?.[0]?.message?.content || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(raw);
        }
        catch (e) {
            this.logger.error(`AI error: ${e.message}`);
            return null;
        }
    }
    placeholder(plan) {
        return `## مقدمه\n\n${plan.topic} از مهم‌ترین موضوعات روانشناسی معاصر است که ${plan.author} از منظر ${plan.angle} آن را بررسی کرده است.\n\n## مبانی نظری\n\n${plan.author} در نظریه خود بر این باور است که درک ${plan.group} کلید ارتباطات سالم‌تر است.\n\n## کاربرد عملی\n\nبرای بهره‌گیری از این نظریه در زندگی روزمره، ابتدا باید خودآگاهی را تقویت کنیم.\n\n## نتیجه‌گیری\n\nنظریه ${plan.author} ابزاری قدرتمند برای رشد فردی و بهبود روابط است.\n\n*منبع: ${plan.author}*`;
    }
    makeSlug(title) {
        return title.replace(/\s+/g, '-').replace(/[^\u0600-\u06FF\-]/g, '').slice(0, 60) + '-' + Date.now().toString(36);
    }
    async getPublishedArticles(page = 1, limit = 20, category) {
        return this.findPublished(limit, (page - 1) * limit, category);
    }
    async findPublished(limit = 20, offset = 0, category) {
        const qb = this.contentRepo.createQueryBuilder('a')
            .where('a.status = :s', { s: ai_content_entity_1.ContentStatus.PUBLISHED })
            .orderBy('a.published_at', 'DESC').take(limit).skip(offset);
        if (category)
            qb.andWhere('a.category = :c', { c: category });
        return qb.getMany();
    }
    async findRelated(id, topicGroup, limit = 3) {
        return this.contentRepo.createQueryBuilder('a')
            .where('a.status = :s', { s: ai_content_entity_1.ContentStatus.PUBLISHED })
            .andWhere('a.topic_group = :g', { g: topicGroup })
            .andWhere('a.id != :id', { id })
            .orderBy('a.published_at', 'DESC').take(limit).getMany();
    }
    async findOne(id) {
        const a = await this.contentRepo.findOne({ where: { id } });
        if (!a)
            throw new common_1.NotFoundException('مقاله یافت نشد');
        await this.contentRepo.update(id, { view_count: () => 'view_count + 1' });
        return a;
    }
    async getPersonalized(testResults) {
        const cats = this.getRecsFromTests(testResults);
        if (!cats.length)
            return this.findPublished(10);
        const rows = await this.dataSource.query("SELECT * FROM ai_content WHERE status='published' AND recommended_for::jsonb ?| $1 ORDER BY published_at DESC LIMIT 10", [cats]).catch(() => []);
        return rows.length ? rows : this.findPublished(10);
    }
    getRecsFromTests(results) {
        const cats = new Set();
        results.forEach(r => {
            const s = r.scores || {};
            const id = (r.test_name || '').toLowerCase();
            if (id.includes('neo')) {
                if ((s.N || 0) > 18) {
                    cats.add('مدیریت استرس');
                    cats.add('بهداشت روان');
                }
                if ((s.A || 0) < 14)
                    cats.add('روابط سالم');
                if ((s.E || 0) < 12)
                    cats.add('خودشناسی');
                if ((s.O || 0) > 20)
                    cats.add('رشد فردی');
            }
            if (id.includes('ecr')) {
                if ((s.ANX || 0) > 38) {
                    cats.add('مدیریت استرس');
                    cats.add('روانشناسی مثبت');
                }
                if ((s.AVO || 0) > 38) {
                    cats.add('روابط سالم');
                    cats.add('خودشناسی');
                }
            }
            if (id.includes('erq')) {
                if ((s.ES || 0) > 18)
                    cats.add('هوش هیجانی');
                if ((s.CR || 0) > 20)
                    cats.add('ذهن‌آگاهی');
            }
        });
        return [...cats];
    }
    async getDrafts() {
        return this.contentRepo.find({ where: { status: ai_content_entity_1.ContentStatus.DRAFT }, order: { created_at: 'DESC' } });
    }
    async approveAndPublish(id, adminId) {
        await this.contentRepo.update(id, { status: ai_content_entity_1.ContentStatus.PUBLISHED, published_at: new Date(), reviewed_by: adminId });
        return this.findOne(id);
    }
    async rejectContent(id, reason) {
        await this.contentRepo.update(id, { status: ai_content_entity_1.ContentStatus.REJECTED, admin_note: reason });
        return this.findOne(id);
    }
    async editContent(id, body) {
        await this.contentRepo.update(id, body);
        return this.findOne(id);
    }
    async answerSupportQuestion(question) {
        if (!AI_API_KEY)
            return { answer: 'سرویس پشتیبانی در دسترس نیست.' };
        try {
            const res = await fetch(AI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
                body: JSON.stringify({ model: AI_MODEL, max_tokens: 500, messages: [{ role: 'user', content: `سوال کاربر: ${question}\nپاسخ کوتاه و مفید فارسی:` }] }),
            });
            const data = await res.json();
            return { answer: data.choices?.[0]?.message?.content || 'پاسخی یافت نشد.' };
        }
        catch {
            return { answer: 'خطا در پردازش سوال.' };
        }
    }
    async scheduleWeeklyContent() {
        const remaining = await this.getUnderrepresentedTopics();
        for (const plan of remaining.slice(0, 4)) {
            await this.generateFromPlan(plan).catch(() => { });
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    async generatePsychologicalArticle(topicOverride, keywords, wordCount) {
        const API_KEY = process.env.AI_API_KEY || '';
        if (!API_KEY)
            throw new Error('API key missing');
        const plan = ARTICLE_PLAN.find(p => topicOverride && p.topic.includes(topicOverride)) || ARTICLE_PLAN[Math.floor(Math.random() * ARTICLE_PLAN.length)];
        const topic = topicOverride || plan.topic;
        const ref = plan.author;
        const cat = plan.group;
        const resp = await fetch('https://api.gapgpt.app/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o', max_tokens: 3500,
                messages: [{ role: 'user', content: `Write a comprehensive psychology article in PERSIAN (Farsi) language.
Topic: ${topic}
Scientific reference: ${ref}

STRICT REQUIREMENT: The article MUST be exactly 1200-1500 Persian words. Do NOT stop before reaching 1200 words.

Write in Persian with this structure (each section must have 2-3 full paragraphs):

## مقدمه
[Start with a real story or surprising statistic. Write 3 full paragraphs in Persian.]

## مفهوم اصلی
[Explain the core concept deeply. Write 3 full paragraphs in Persian.]

## پشتوانه علمی
[Explain the science from ${ref}. Include research findings. Write 3 full paragraphs in Persian.]

## کاربرد در زندگی روزمره
[Real-life Iranian examples. Write 2-3 full paragraphs in Persian.]

## ۵ تکنیک عملی
[Write 5 numbered practical techniques, each with 3-4 sentences explanation in Persian.]

## نتیجه‌گیری
[Inspiring conclusion. Write 2 full paragraphs in Persian.]

Start writing the Persian article immediately without any introduction:`
                    }]
            })
        });
        const data = await resp.json();
        let body = data.choices?.[0]?.message?.content || '';
        if (!body)
            throw new Error('Empty response from AI');
        // اگه کوتاه بود یه بار دیگه با prompt ساده‌تر تلاش کن
        if (body.split(' ').length < 500) {
            this.logger.warn(`Short content (${body.split(' ').length}w), retrying...`);
            const resp2 = await fetch('https://api.gapgpt.app/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-4o', max_tokens: 3000,
                    messages: [{ role: 'user', content: `یک مقاله روانشناسی کامل فارسی درباره "${topic}" بنویس. حداقل ۱۰۰۰ کلمه.` }]
                })
            });
            const data2 = await resp2.json();
            const body2 = data2.choices?.[0]?.message?.content || '';
            if (body2.split(' ').length > body.split(' ').length)
                body = body2;
        }
        const catMap = {
            'روابط سالم': 'روابط سالم', 'relationship': 'روابط سالم',
            'هوش هیجانی': 'هوش هیجانی', 'emotion': 'هوش هیجانی',
            'رشد فردی': 'رشد فردی', 'growth': 'رشد فردی',
            'بهداشت روان': 'بهداشت روان', 'health': 'بهداشت روان',
            'مدیریت استرس': 'مدیریت استرس', 'stress': 'مدیریت استرس',
            'ذهن‌آگاهی': 'ذهن‌آگاهی', 'mindfulness': 'ذهن‌آگاهی',
            'روانشناسی مثبت': 'روانشناسی مثبت',
            'خودشناسی': 'خودشناسی',
        };
        const category = catMap[cat] || cat || 'رشد فردی';
        const emMap = { 'روابط سالم': '💞', 'بهداشت روان': '🌿', 'هوش هیجانی': '💡', 'رشد فردی': '🚀', 'مدیریت استرس': '🧘', 'ذهن‌آگاهی': '🌸', 'روانشناسی مثبت': '✨', 'خودشناسی': '🔍' };
        const clMap = { 'روابط سالم': '#f97316', 'بهداشت روان': '#22c55e', 'هوش هیجانی': '#0ea5e9', 'رشد فردی': '#ec4899', 'مدیریت استرس': '#FF6B00', 'ذهن‌آگاهی': '#10b981', 'روانشناسی مثبت': '#a855f7', 'خودشناسی': '#eab308' };
        const slug = `admin-${topic.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '').slice(0, 40)}-${Date.now()}`;
        const rt = Math.max(5, Math.min(25, Math.floor(body.split(' ').length / 200)));
        const [row] = await this.dataSource.query(`
      INSERT INTO articles(title,slug,summary,content,category,author,read_time,image_url,is_published,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())
      RETURNING id,title,slug,category,read_time
    `, [topic, slug,
            `مقاله تولیدشده درباره ${topic}`,
            body, category, ref, rt,
            `https://loremflickr.com/800/400/${encodeURIComponent(category)},psychology?lock=${Math.abs(slug.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 500}`
        ]);
        this.logger.log(`✅ Article saved to articles table: ${topic}`);
        return { ...row, word_count: body.split(' ').length };
    }
};
exports.AiContentService = AiContentService;
__decorate([
    (0, schedule_1.Cron)('30 4 * * *') // 8:00 صبح ایران
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiContentService.prototype, "dailyArticleGeneration", null);
exports.AiContentService = AiContentService = AiContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_3.InjectRepository)(ai_content_entity_1.AiContent)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_4.Repository,
        typeorm_2.DataSource])
], AiContentService);
