"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProvinceToProfile1760000000000 = void 0;
class AddProvinceToProfile1760000000000 {
    constructor() {
        this.name = 'AddProvinceToProfile1760000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN IF NOT EXISTS "province" character varying
    `);
        // کاربران قدیمی که city = نام استان داشتند
        const provinces = [
            'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'آذربایجان غربی',
            'البرز', 'اردبیل', 'بوشهر', 'چهارمحال و بختیاری', 'گیلان', 'گلستان', 'همدان',
            'هرمزگان', 'ایلام', 'کرمان', 'کرمانشاه', 'خوزستان', 'کهگیلویه و بویراحمد',
            'کردستان', 'لرستان', 'مازندران', 'مرکزی', 'قزوین', 'قم', 'سمنان',
            'سیستان و بلوچستان', 'خراسان شمالی', 'خراسان جنوبی', 'زنجان', 'یزد',
        ];
        for (const prov of provinces) {
            await queryRunner.query(`UPDATE "profiles" SET "province" = $1 WHERE "city" = $1 AND "province" IS NULL`, [prov]);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "province"`);
    }
}
exports.AddProvinceToProfile1760000000000 = AddProvinceToProfile1760000000000;
